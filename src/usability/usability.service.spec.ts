import { BadRequestException } from '@nestjs/common';
import { RecordUsabilityEventDto } from './dto/record-usability-event.dto';
import { SubmitSusDto } from './dto/submit-sus.dto';
import { UsabilityService } from './usability.service';

describe('UsabilityService', () => {
  const event = (overrides: Record<string, unknown> = {}) =>
    ({
      id: 'event-1',
      actorId: { toString: () => 'actor-1' },
      eventName: 'task_completed',
      taskId: 'T2_run_prediction',
      sessionId: 'study-1',
      routeKey: 'predictions',
      occurredAt: new Date('2026-08-29T12:00:00.000Z'),
      durationMs: 2400,
      success: true,
      properties: {},
      createdAt: new Date('2026-08-29T12:00:00.000Z'),
      ...overrides,
    }) as never;

  it('records events without accepting sensitive properties', async () => {
    const repository = {
      createEvent: jest.fn().mockResolvedValue(event()),
    };
    const service = new UsabilityService(repository as never);
    const dto = {
      eventName: 'task_completed',
      taskId: 'T2_run_prediction',
      sessionId: 'study-1',
      routeKey: 'predictions',
      properties: { action: 'submit' },
    } as RecordUsabilityEventDto;

    const result = await service.recordEvent('507f1f77bcf86cd799439011', dto);

    expect(repository.createEvent).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      expect.objectContaining({ properties: { action: 'submit' } }),
    );
    expect(result.actorId).toBe('actor-1');
  });

  it('rejects PII-like event properties', async () => {
    const service = new UsabilityService({} as never);
    const dto = {
      eventName: 'task_failed',
      sessionId: 'study-1',
      routeKey: 'predictions',
      properties: { message: 'private symptom' },
    } as unknown as RecordUsabilityEventDto;

    await expect(
      service.recordEvent('507f1f77bcf86cd799439011', dto),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects events outside the bounded timestamp window', async () => {
    const service = new UsabilityService({} as never);
    const dto = {
      eventName: 'task_started',
      sessionId: 'study-1',
      routeKey: 'dashboard',
      occurredAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    } as RecordUsabilityEventDto;

    await expect(
      service.recordEvent('507f1f77bcf86cd799439011', dto),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('calculates the standard SUS score and requires consent', async () => {
    const repository = {
      createSurvey: jest.fn().mockResolvedValue({
        submittedAt: new Date('2026-08-29T12:00:00.000Z'),
      }),
    };
    const service = new UsabilityService(repository as never);
    const dto = {
      studySessionId: 'study-1',
      answers: [4, 2, 4, 1, 5, 2, 4, 2, 5, 1],
      consent: true,
    } as SubmitSusDto;

    const result = await service.submitSus('actor-1', dto);

    expect(result.score).toBe(85);
    await expect(
      service.submitSus('actor-1', { ...dto, consent: false }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('aggregates task completion, error, abandonment, and timing metrics', async () => {
    const repository = {
      findEvents: jest.fn().mockResolvedValue([
        event({ eventName: 'task_started', durationMs: undefined }),
        event({ eventName: 'task_completed', durationMs: 1000 }),
        event({
          id: 'event-2',
          eventName: 'validation_error',
          durationMs: undefined,
        }),
        event({
          id: 'event-3',
          eventName: 'task_abandoned',
          durationMs: undefined,
        }),
      ]),
      findSurveyScores: jest.fn().mockResolvedValue([]),
    };
    const service = new UsabilityService(repository as never);

    const summary = await service.getSummary({});
    const task = summary.tasks.find(
      (item) => item.taskId === 'T2_run_prediction',
    );

    expect(task).toEqual(
      expect.objectContaining({
        started: 1,
        completed: 1,
        abandoned: 1,
        validationErrors: 1,
        completionRate: 1,
        errorRate: 1,
        medianDurationMs: 1000,
      }),
    );
  });
});
