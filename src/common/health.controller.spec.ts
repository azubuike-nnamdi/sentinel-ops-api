import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('returns liveness status', () => {
    const result = controller.check();
    expect(result.message).toContain('healthy');
    expect(result.data.status).toBe('ok');
  });

  it('returns readiness status', () => {
    const result = controller.ready();
    expect(result.data.status).toBe('ready');
  });
});
