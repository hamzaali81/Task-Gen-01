import { Request } from 'express';

/**
 * Extended Express Request interface with authenticated user
 * Used throughout the application for type-safe user access
 */
export interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
  };
  workspaceId?: string;
}
