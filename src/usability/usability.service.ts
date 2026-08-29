import { BadRequestException, Injectable } from '@nestjs/common';
import { SubmitSusDto } from './dto/submit-sus.dto';
import { RecordUsabilityEventDto } from './dto/record-usability-event.dto';
import { UsabilityQueryDto } from './dto/usability-query.dto';
import {
  USABILITY_TASK_IDS,
  CreateUsabilityEventData,
  IUsabilityEvent,
  UsabilitySummary,
  UsabilityTaskId,
} from './interfaces/usability.interface';
import { UsabilityEventsRepository } from './repositories/usability-events.repository';
import { UsabilityEventDocument } from './schemas/usability-event.schema';

const MAX_EVENT_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;
const SAFE_PROPERTY_KEYS = new Set([
  'metric',
  'value',
  'errorCode',
  'action',
  'severity',
]);
const SENSITIVE_KEY_PATTERN =
  /(password|token|secret|authorization|cookie|email|phone|message|symptom|payload|url|ip|user.?agent|key)/i;

@Injectable()
export class UsabilityService {
  constructor(
    private readonly usabilityEventsRepository: UsabilityEventsRepository,
  ) {}

  async recordEvent(
    actorId: string,
    dto: RecordUsabilityEventDto,
  ): Promise<IUsabilityEvent> {
    const occurredAt = this.normalizeOccurredAt(dto.occurredAt);
    const properties = this.validateProperties(dto.properties);
    const data: CreateUsabilityEventData = {
      eventName: dto.eventName,
      taskId: dto.taskId,
      sessionId: dto.sessionId,
      routeKey: dto.routeKey,
      occurredAt,
      durationMs: dto.durationMs,
      success: dto.success,
      errorCategory: dto.errorCategory,
      properties,
    };
    const event = await this.usabilityEventsRepository.createEvent(
      actorId,
      data,
    );
    return this.toEvent(event);
  }

  async submitSus(actorId: string, dto: SubmitSusDto) {
    if (!dto.consent) {
      throw new BadRequestException(
        'Consent is required to store usability survey responses',
      );
    }

    const score = this.calculateSusScore(dto.answers);
    const survey = await this.usabilityEventsRepository.createSurvey({
      actorId,
      studySessionId: dto.studySessionId,
      answers: dto.answers,
      score,
      feedback: dto.feedback?.trim() || undefined,
    });
    if (dto.feedback?.trim()) {
      await this.usabilityEventsRepository.createEvent(actorId, {
        eventName: 'feedback_submitted',
        sessionId: dto.studySessionId,
        routeKey: 'usability',
        properties: { action: 'sus_feedback' },
      });
    }

    return {
      score,
      submittedAt: survey.submittedAt.toISOString(),
    };
  }

  async getSummary(query: UsabilityQueryDto): Promise<UsabilitySummary> {
    const { from, to } = this.resolvePeriod(query);
    const events = await this.usabilityEventsRepository.findEvents(
      from,
      to,
      query.taskId,
    );
    const surveys = await this.usabilityEventsRepository.findSurveyScores(
      from,
      to,
    );

    return {
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
      sampleSize: new Set(events.map((event) => event.sessionId)).size,
      tasks: USABILITY_TASK_IDS.map((taskId) =>
        this.summarizeTask(taskId, events),
      ),
      webVitals: this.summarizeWebVitals(events),
      sus: {
        responses: surveys.length,
        averageScore:
          surveys.length > 0
            ? this.round(
                surveys.reduce((sum, survey) => sum + survey.score, 0) /
                  surveys.length,
              )
            : null,
      },
    };
  }

  async purgeActor(actorId: string) {
    return this.usabilityEventsRepository.deleteByActor(actorId);
  }

  calculateSusScore(answers: number[]): number {
    if (
      answers.length !== 10 ||
      answers.some((answer) => answer < 1 || answer > 5)
    ) {
      throw new BadRequestException(
        'SUS requires exactly 10 answers, each from 1 to 5',
      );
    }

    const total = answers.reduce(
      (sum, answer, index) => sum + (index % 2 === 0 ? answer - 1 : 5 - answer),
      0,
    );
    return this.round(total * 2.5);
  }

  private summarizeTask(
    taskId: UsabilityTaskId,
    events: UsabilityEventDocument[],
  ) {
    const taskEvents = events.filter((event) => event.taskId === taskId);
    const count = (eventName: string) =>
      taskEvents.filter((event) => event.eventName === eventName).length;
    const started = count('task_started');
    const completed = count('task_completed');
    const failed = count('task_failed');
    const abandoned = count('task_abandoned');
    const validationErrors = count('validation_error');
    const resultsViewed = count('result_viewed');
    const durations = taskEvents
      .filter(
        (event) =>
          event.eventName === 'task_completed' &&
          typeof event.durationMs === 'number',
      )
      .map((event) => event.durationMs as number)
      .sort((a, b) => a - b);

    return {
      taskId,
      started,
      completed,
      failed,
      abandoned,
      validationErrors,
      resultsViewed,
      completionRate: this.rate(completed, started),
      abandonmentRate: this.rate(abandoned, started),
      errorRate: this.rate(failed + validationErrors, started),
      medianDurationMs: this.percentile(durations, 0.5),
      p95DurationMs: this.percentile(durations, 0.95),
    };
  }

  private summarizeWebVitals(events: UsabilityEventDocument[]) {
    const byMetric = new Map<string, number[]>();
    for (const event of events) {
      if (
        event.eventName !== 'web_vital_recorded' ||
        typeof event.properties?.metric !== 'string' ||
        typeof event.properties?.value !== 'number'
      ) {
        continue;
      }
      const values = byMetric.get(event.properties.metric) ?? [];
      values.push(event.properties.value);
      byMetric.set(event.properties.metric, values);
    }

    return Array.from(byMetric.entries()).map(([metric, values]) => ({
      metric,
      count: values.length,
      average: this.round(
        values.reduce((sum, value) => sum + value, 0) / values.length,
      ),
    }));
  }

  private resolvePeriod(query: UsabilityQueryDto): { from: Date; to: Date } {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from
      ? new Date(query.from)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (
      Number.isNaN(from.getTime()) ||
      Number.isNaN(to.getTime()) ||
      from > to ||
      to.getTime() - from.getTime() > 90 * 24 * 60 * 60 * 1000
    ) {
      throw new BadRequestException(
        'Usability summary period must be valid and no longer than 90 days',
      );
    }
    return { from, to };
  }

  private normalizeOccurredAt(value?: string): Date {
    const date = value ? new Date(value) : new Date();
    const now = Date.now();
    if (
      Number.isNaN(date.getTime()) ||
      date.getTime() < now - MAX_EVENT_AGE_MS ||
      date.getTime() > now + MAX_FUTURE_SKEW_MS
    ) {
      throw new BadRequestException(
        'occurredAt must be within the last 30 days and not in the future',
      );
    }
    return date;
  }

  private validateProperties(
    properties?: Record<string, unknown>,
  ): Record<string, string | number | boolean> {
    if (!properties) {
      return {};
    }
    const safe: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(properties)) {
      if (!SAFE_PROPERTY_KEYS.has(key) || SENSITIVE_KEY_PATTERN.test(key)) {
        throw new BadRequestException(
          `Usability property "${key}" is not allowed`,
        );
      }
      if (
        typeof value !== 'string' &&
        typeof value !== 'number' &&
        typeof value !== 'boolean'
      ) {
        throw new BadRequestException(
          `Usability property "${key}" must be a string, number, or boolean`,
        );
      }
      if (typeof value === 'string' && value.length > 100) {
        throw new BadRequestException(
          `Usability property "${key}" is too long`,
        );
      }
      if (typeof value === 'number' && !Number.isFinite(value)) {
        throw new BadRequestException(
          `Usability property "${key}" must be finite`,
        );
      }
      safe[key] = value;
    }
    return safe;
  }

  private toEvent(event: UsabilityEventDocument): IUsabilityEvent {
    return {
      id: event.id as string,
      actorId: event.actorId.toString(),
      eventName: event.eventName,
      taskId: event.taskId,
      sessionId: event.sessionId,
      routeKey: event.routeKey,
      occurredAt: event.occurredAt,
      durationMs: event.durationMs,
      success: event.success,
      errorCategory: event.errorCategory,
      properties: event.properties,
      createdAt: event.createdAt,
    };
  }

  private rate(numerator: number, denominator: number): number {
    return denominator > 0 ? this.round(numerator / denominator) : 0;
  }

  private percentile(values: number[], percentile: number): number | null {
    if (values.length === 0) {
      return null;
    }
    const index = Math.min(
      values.length - 1,
      Math.ceil(percentile * values.length) - 1,
    );
    return Math.round(values[index]);
  }

  private round(value: number): number {
    return Math.round(value * 1000) / 1000;
  }
}
