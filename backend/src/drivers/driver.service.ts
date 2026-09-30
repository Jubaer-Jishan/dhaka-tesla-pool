import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { JwtPayload } from '../auth/auth.types';
import { Pool } from '../database/entities/pool.entity';
import { PoolMember } from '../database/entities/pool-member.entity';
import { RideRequestStatus, PoolStatus } from '../database/enums';
import { User } from '../database/entities/user.entity';
import { UserRole } from '../database/enums';
import { Vehicle } from '../database/entities/vehicle.entity';
import { UpdateDriverStatusDto } from './dto/update-driver-status.dto';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Pool)
    private readonly poolRepository: Repository<Pool>,
    @InjectRepository(PoolMember)
    private readonly poolMemberRepository: Repository<PoolMember>,
  ) {}

  async updateStatus(currentUser: JwtPayload, dto: UpdateDriverStatusDto) {
    this.ensureDriver(currentUser);
    const result = await this.userRepository.update(currentUser.sub, {
      isOnline: dto.isOnline,
    });

    if (!result.affected) {
      throw new NotFoundException('Driver account not found');
    }

    return { isOnline: dto.isOnline };
  }

  async getAssignedVehicle(currentUser: JwtPayload) {
    this.ensureDriver(currentUser);
    const vehicle = await this.vehicleRepository.findOne({
      where: { owner: { id: currentUser.sub } },
    });

    if (!vehicle) {
      throw new NotFoundException('No vehicle is assigned to this driver');
    }

    return vehicle;
  }

  async getCurrent(currentUser: JwtPayload) {
    this.ensureDriver(currentUser);

    return this.poolRepository.findOne({
      where: {
        driver: { id: currentUser.sub },
        status: In([PoolStatus.OPEN, PoolStatus.FULL, PoolStatus.IN_PROGRESS]),
      },
      relations: {
        driver: true,
        vehicle: true,
        members: { user: true, rideRequest: true },
      },
      order: { updatedAt: 'DESC' },
    });
  }

  async getHistory(currentUser: JwtPayload) {
    this.ensureDriver(currentUser);

    return this.poolMemberRepository.find({
      where: {
        pool: { driver: { id: currentUser.sub } },
        rideRequest: {
          status: In([RideRequestStatus.COMPLETED, RideRequestStatus.CANCELLED]),
        },
      },
      relations: {
        pool: { driver: true, vehicle: true },
        user: true,
        rideRequest: { requester: true, statusHistory: true },
      },
      order: { updatedAt: 'DESC' },
    });
  }

  private ensureDriver(currentUser: JwtPayload): void {
    if (currentUser.role !== UserRole.DRIVER) {
      throw new ForbiddenException('Driver access is required');
    }
  }
}