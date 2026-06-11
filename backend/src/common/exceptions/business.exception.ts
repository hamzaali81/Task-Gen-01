import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Custom business logic exception
 * Use for domain-specific errors that aren't technical failures
 */
export class BusinessException extends HttpException {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(
      {
        statusCode,
        message,
        error: 'Business Logic Error',
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }
}

/**
 * Exception for workspace-related authorization issues
 */
export class WorkspaceAccessDeniedException extends HttpException {
  constructor(workspaceId: string) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        message: `Access denied to workspace: ${workspaceId}`,
        error: 'Workspace Access Denied',
        timestamp: new Date().toISOString(),
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

/**
 * Exception for AI-related errors
 */
export class AIServiceException extends HttpException {
  constructor(message: string, originalError?: Error) {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message,
        error: 'AI Service Error',
        timestamp: new Date().toISOString(),
        ...(originalError && { details: originalError.message }),
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
