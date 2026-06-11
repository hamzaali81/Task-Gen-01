import { Injectable, NestMiddleware, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UsersService } from '../../users/users.service';

declare global {
  namespace Express {
    interface Request {
      workspaceId?: string;
    }
  }
}

@Injectable()
export class WorkspaceMiddleware implements NestMiddleware {
  constructor(private usersService: UsersService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const workspaceId = req.headers['x-workspace-id'] as string;

    if (!workspaceId) {
      throw new BadRequestException('x-workspace-id header is required');
    }

    // Check if user has access to this workspace
    const user = req.user as any;
    if (user && user.userId) {
      const hasAccess = await this.usersService.validateUserWorkspace(
        user.userId,
        workspaceId,
      );

      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this workspace');
      }
    }

    // Attach workspaceId to request
    req.workspaceId = workspaceId;
    next();
  }
}
