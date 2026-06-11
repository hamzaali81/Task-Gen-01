import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * HttpExceptionFilter — global exception filter for all HTTP exceptions.
 *
 * Catches every HttpException (including NestJS built-ins like
 * NotFoundException, ForbiddenException, BadRequestException, etc.)
 * and returns a consistent JSON error envelope:
 *
 * {
 *   statusCode: number,
 *   message: string | string[],
 *   error: string,
 *   timestamp: string,
 *   path: string
 * }
 *
 * This prevents raw NestJS error objects (which may include stack traces)
 * from leaking to API consumers in production.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception.getResponse();

    // NestJS validation pipe returns { message: string[], error: string }
    // Custom exceptions may return a plain string or an object
    let message: string | string[];
    let error: string;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, unknown>;
      message = (resp.message as string | string[]) ?? exception.message;
      error = (resp.error as string) ?? exception.name;
    } else {
      message = exception.message;
      error = exception.name;
    }

    const body = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logger.warn(`${request.method} ${request.url} → ${status}: ${JSON.stringify(message)}`);

    response.status(status).json(body);
  }
}
