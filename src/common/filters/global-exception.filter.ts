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

  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    const requestId =
      request.requestId ||
      (request.headers[REQUEST_ID_HEADER] as string | undefined) ||
      'unknown';

    const { status, message, data } = this.resolveException(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        {
          requestId,
          path: request.url,
          method: request.method,
          err: exception,
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
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        return { status, message: exceptionResponse, data: null };
      }

      const body = exceptionResponse as ValidationErrorBody;
      const message = Array.isArray(body.message)
        ? body.message.join('; ')
        : body.message || exception.message;

      const data =
        Array.isArray(body.message) && body.message.length > 0
          ? { errors: body.message }
          : null;

      return { status, message, data };
    }

    if (exception instanceof Error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: isProduction
          ? 'An unexpected error occurred'
          : exception.message,
        data: isProduction
          ? null
          : { name: exception.name, stack: exception.stack },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      data: null,
    };
  }
}
