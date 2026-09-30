import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { UserRole } from '../database/enums';
import { JwtPayload, AuthUser } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

const PASSWORD_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone.trim();
    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);
    const user = this.userRepository.create({
      fullName: dto.fullName.trim(),
      email,
      phone,
      passwordHash,
      role: dto.role,
    });

    try {
      const savedUser = await this.userRepository.save(user);
      return this.createAuthResponse(savedUser);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Email or phone is already registered');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.trim().toLowerCase() },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        passwordHash: true,
        role: true,
      },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createAuthResponse(user);
  }

  private async createAuthResponse(user: User) {
    const authUser: AuthUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: authUser,
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    return error instanceof QueryFailedError && (error as QueryFailedError & { driverError?: { code?: string } }).driverError?.code === '23505';
  }
}