import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../auth.types';

export const CurrentUser = createParamDecorator(
  (property: keyof JwtPayload | undefined, context: ExecutionContext): JwtPayload | JwtPayload[keyof JwtPayload] => {
    const request = context.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    return property ? request.user[property] : request.user;
  },
);