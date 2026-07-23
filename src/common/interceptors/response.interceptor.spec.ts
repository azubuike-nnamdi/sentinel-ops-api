import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, firstValueFrom } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor', () => {
  const interceptor = new ResponseInterceptor<unknown>();

  const createContext = (): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          requestId: 'req-abc',
          headers: {},
        }),
      }),
    }) as unknown as ExecutionContext;

  it('wraps plain payloads in the standard response envelope', async () => {
    const handler: CallHandler = {
      handle: () => of({ id: 1 }),
    };

    const result = await firstValueFrom(
      interceptor.intercept(createContext(), handler),
    );

    expect(result).toEqual({
      success: true,
      message: 'Success',
      data: { id: 1 },
      timestamp: expect.any(String),
      requestId: 'req-abc',
    });
  });

  it('preserves explicit message/data controller returns', async () => {
    const handler: CallHandler = {
      handle: () =>
        of({
          message: 'User created',
          data: { email: 'ops@sentinel.io' },
        }),
    };

    const result = await firstValueFrom(
      interceptor.intercept(createContext(), handler),
    );

    expect(result.message).toBe('User created');
    expect(result.data).toEqual({ email: 'ops@sentinel.io' });
    expect(result.success).toBe(true);
  });
});
