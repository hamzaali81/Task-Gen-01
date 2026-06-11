import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';

/**
 * Extend Express Request to carry the validated workspace ID.
 * This global augmentation is picked up by all controllers via `req.workspaceId`.
 */
declare global {
  namespace Express {
    interface Request {
      workspaceId?: string;
    }
  }
}

/**
 * WorkspaceMiddleware
 *
 * Runs in the NestJS middleware pipeline (BEFORE route guards).
 * Because `req.user` is set by the Passport JWT guard — which runs AFTER
 * middleware — we must manually decode the JWT here using JwtService.
 *
 * Responsibilities:
 * 1. Validate that `x-workspace-id` header is present
 * 2. Decode the Bearer token from the Authorization header
 * 3. Verify the authenticated user actually belongs to that workspace (→ 403 if not)
 * 4. Attach `req.workspaceId` for downstream use in controllers/services
 */
@Injectable()
export class WorkspaceMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const workspaceId = req.headers['x-workspace-id'] as string;

    if (!workspaceId) {
      throw new BadRequestException('x-workspace-id header is required');
    }

    // Extract Bearer token — guards haven't run yet so we decode manually
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header is missing or malformed');
    }

    const token = authHeader.split(' ')[1];

    let userId: string;
    try {
      const payload = this.jwtService.verify(token);
      userId = payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Enforce workspace ownership — return 403 if user doesn't belong to this workspace
    const hasAccess = await this.usersService.validateUserWorkspace(userId, workspaceId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    req.workspaceId = workspaceId;
    next();
  }
}
