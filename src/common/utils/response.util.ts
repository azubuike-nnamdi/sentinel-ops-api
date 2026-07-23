import { ApiResponse } from '../interfaces';

export class ResponseUtil {
  static success<T>(
    data: T,
    message = 'Success',
    requestId = 'unknown',
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      requestId,
    };
  }

  static failure(
    message: string,
    requestId = 'unknown',
    data: Record<string, unknown> | null = null,
  ): ApiResponse {
    return {
      success: false,
      message,
      data,
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
}
