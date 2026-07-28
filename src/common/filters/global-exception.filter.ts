import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { REQUEST_ID_HEADER } from '../constants';
import { ApiResponse } from '../interfaces';

interface ValidationErrorBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly configService: ConfigService) { }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    const requestId =
      request.requestId ||
      (request.headers[REQUEST_ID_HEADER] as string | undefined) ||
      'unknown';

    const { status, message, data } = this.resolveException(exception);

    if (status >= Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      const err =
        exception instanceof Error
          ? {
            name: exception.name,
            message: exception.message,
            stack: exception.stack,
          }
          : { message: String(exception) };

      this.logger.error(
        {
          requestId,
          path: request.url,
          method: request.method,
          err,
        },
        message,
      );
    } else {
      this.logger.warn({
        requestId,
        path: request.url,
        method: request.method,
        status,
        message,
      });
    }

    const body: ApiResponse = {
      success: false,
      message,
      data,
      timestamp: new Date().toISOString(),
      requestId,
    };

    response.status(status).json(body);
  }

  private resolveException(exception: unknown): {
    status: number;
    message: string;
    data: Record<string, unknown> | null;
  } {
    const isProduction =
      this.configService.get<string>('app.nodeEnv') === 'production';

    if (exception instanceof HttpException) {
      return this.resolveHttpException(exception);
    }

    // Narrow via helper so `.message` is never read from a `never`-collapsed union.
    const error = GlobalExceptionFilter.toError(exception);
    if (error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: isProduction ? 'An unexpected error occurred' : error.message,
        data: isProduction ? null : { name: error.name, stack: error.stack },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      data: null,
    };
  }

  private resolveHttpException(exception: HttpException): {
    status: number;
    message: string;
    data: Record<string, unknown> | null;
  } {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const fallbackMessage =
      GlobalExceptionFilter.toError(exception)?.message ||
      'An unexpected error occurred';

    if (typeof exceptionResponse === 'string') {
      return { status, message: exceptionResponse, data: null };
    }

    const body = exceptionResponse as ValidationErrorBody;
    const message = Array.isArray(body.message)
      ? body.message.join('; ')
      : (body.message ?? fallbackMessage);

    const data =
      Array.isArray(body.message) && body.message.length > 0
        ? { errors: body.message }
        : null;

    return { status, message, data };
  }

  private static toError(exception: unknown): Error | null {
    return exception instanceof Error ? exception : null;
  }
}
