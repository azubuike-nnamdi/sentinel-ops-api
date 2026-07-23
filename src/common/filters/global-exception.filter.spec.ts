import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });

  const createHost = (): ArgumentsHost =>
    ({
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({
          url: '/api/v1/test',
          method: 'GET',
          requestId: 'req-123',
          headers: {},
        }),
      }),
    }) as unknown as ArgumentsHost;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('formats HttpException responses', () => {
    const configService = {
      get: jest.fn().mockReturnValue('development'),
    } as unknown as ConfigService;

    const filter = new GlobalExceptionFilter(configService);
    filter.catch(
      new HttpException('Not found', HttpStatus.NOT_FOUND),
      createHost(),
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Not found',
        requestId: 'req-123',
      }),
    );
  });

  it('hides internal details in production', () => {
    const configService = {
      get: jest.fn().mockReturnValue('production'),
    } as unknown as ConfigService;

    const filter = new GlobalExceptionFilter(configService);
    filter.catch(new Error('secret stack'), createHost());

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'An unexpected error occurred',
        data: null,
      }),
    );
  });
});
