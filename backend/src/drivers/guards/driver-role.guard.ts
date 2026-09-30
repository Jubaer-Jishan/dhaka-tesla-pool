import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../../auth/auth.types';
import { UserRole } from '../../database/enums';

@Injectable()
export class DriverRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();

    if (request.user?.role !== UserRole.DRIVER) {
      throw new ForbiddenException('Driver access is required');
    }

    return true;
  }
}