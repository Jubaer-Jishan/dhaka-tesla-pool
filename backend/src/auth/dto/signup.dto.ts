import { IsEmail, IsEnum, IsString, Length, Matches } from 'class-validator';
import { UserRole } from '../../database/enums';

export class SignupDto {
  @IsString()
  @Length(2, 120)
  fullName: string;

  @IsEmail()
  @Length(5, 255)
  email: string;

  @IsString()
  @Matches(/^\+?[0-9 ()-]{7,30}$/)
  phone: string;

  @IsString()
  @Length(8, 72)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}