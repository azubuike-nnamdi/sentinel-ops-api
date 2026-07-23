import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, map } from 'rxjs';
import { REQUEST_ID_HEADER } from '../constants';
import { ApiResponse } from '../interfaces';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { requestId?: string }>();

    const requestId =
      request.requestId ||
      (request.headers[REQUEST_ID_HEADER] as string | undefined) ||
      'unknown';

    return next.handle().pipe(
      map((data) => {
        if (this.isAlreadyWrapped(data)) {
          return {
            ...(data as ApiResponse<T>),
            requestId: (data as ApiResponse<T>).requestId || requestId,
            timestamp:
              (data as ApiResponse<T>).timestamp || new Date().toISOString(),
          };
        }

        const message =
          data &&
          typeof data === 'object' &&
          'message' in (data as Record<string, unknown>) &&
          typeof (data as Record<string, unknown>).message === 'string'
            ? ((data as Record<string, unknown>).message as string)
            : 'Success';

        const payload =
          data &&
          typeof data === 'object' &&
          'data' in (data as Record<string, unknown>) &&
          'message' in (data as Record<string, unknown>)
            ? ((data as Record<string, unknown>).data as T)
            : data;

        return {
          success: true,
          message,
          data: (payload ?? null) as T | null,
          timestamp: new Date().toISOString(),
          requestId,
        };
      }),
    );
  }

  private isAlreadyWrapped(data: unknown): data is ApiResponse<T> {
    return (
      !!data &&
      typeof data === 'object' &&
      'success' in data &&
      'message' in data &&
      'timestamp' in data &&
      'requestId' in data
    );
  }
}
