import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from '../alerts/alerts.service';
import { IncidentSeverity, IncidentStatus } from '../common/enums';
import { IncidentsService } from './incidents.service';
import { IncidentsRepository } from './repositories/incidents.repository';

describe('IncidentsService', () => {
  let service: IncidentsService;
  let alertsService: { createSafely: jest.Mock };

  beforeEach(async () => {
    alertsService = { createSafely: jest.fn().mockResolvedValue(null) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentsService,
        {
          provide: IncidentsRepository,
          useValue: {
            create: jest.fn().mockResolvedValue({
              id: 'i1',
              title: 'Checkout failures',
              description: 'Error rate spiked',
              severity: IncidentSeverity.HIGH,
              status: IncidentStatus.OPEN,
              serviceIds: [{ toString: () => 's1' }],
              anomalyIds: [],
              rootCause: undefined,
              assignedTo: null,
              resolvedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
        },
        { provide: AlertsService, useValue: alertsService },
      ],
    }).compile();

    service = module.get(IncidentsService);
  });

  it('creates an in-app alert when an incident is opened', async () => {
    const incident = await service.create({
      title: 'Checkout failures',
      description: 'Error rate spiked',
      severity: IncidentSeverity.HIGH,
      serviceIds: ['s1'],
    });

    expect(incident.id).toBe('i1');
    expect(alertsService.createSafely).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Incident: Checkout failures',
        serviceId: 's1',
        incidentId: 'i1',
        channel: 'in-app',
      }),
    );
  });
});
