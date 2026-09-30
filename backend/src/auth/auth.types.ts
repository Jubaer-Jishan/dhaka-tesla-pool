import { UserRole } from '../database/enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
}