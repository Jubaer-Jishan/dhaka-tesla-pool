import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { JwtPayload } from '../auth/auth.types';
import { RideRequest } from '../database/entities/ride-request.entity';
import { PoolMember } from '../database/entities/pool-member.entity';
import { RideStatusHistory } from '../database/entities/ride-status-history.entity';
import { PoolStatus, RideRequestStatus, UserRole } from '../database/enums';
import { CreateRideRequestDto } from './dto/create-ride-request.dto';
import { FareCalculationService } from './fare-calculation.service';

@Injectable()
export class RideRequestService {
  constructor(
    @InjectRepository(RideRequest)
    private readonly rideRequestRepository: Repository<RideRequest>,
    private readonly fareCalculationService: FareCalculationService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateRideRequestDto, currentUser: JwtPayload) {
    if (currentUser.role !== UserRole.PASSENGER) {
      throw new ForbiddenException('Only passengers can create ride requests');
    }

    const estimatedFare = this.fareCalculationService.calculate(
      dto.estimatedDistanceKm,
      dto.requestedSeats,
    );
    const rideRequest = this.rideRequestRepository.create({
      requester: { id: currentUser.sub },
      pickupArea: dto.pickupArea,
      destinationArea: dto.destinationArea,
      requestedSeats: dto.requestedSeats,
      estimatedDistanceKm: dto.estimatedDistanceKm,
      estimatedFare,
      requestedFor: new Date(),
      status: RideRequestStatus.REQUESTED,
      pool: null,
    });

    return this.rideRequestRepository.save(rideRequest);
  }

  async getCurrent(currentUser: JwtPayload) {
    this.ensurePassenger(currentUser);

    return this.rideRequestRepository.findOne({
      where: {
        requester: { id: currentUser.sub },
        status: In([
          RideRequestStatus.REQUESTED,
          RideRequestStatus.MATCHED,
          RideRequestStatus.ACCEPTED,
          RideRequestStatus.DRIVER_ARRIVED,
          RideRequestStatus.STARTED,
          RideRequestStatus.IN_PROGRESS,
        ]),
      },
      relations: {
        requester: true,
        pool: { driver: true, vehicle: { owner: true }, members: { user: true } },
        poolMember: true,
        statusHistory: true,
      },
      order: { updatedAt: 'DESC' },
    });
  }

  async getHistory(currentUser: JwtPayload) {
    this.ensurePassenger(currentUser);

    return this.rideRequestRepository.find({
      where: {
        requester: { id: currentUser.sub },
        status: In([RideRequestStatus.COMPLETED, RideRequestStatus.CANCELLED]),
      },
      relations: {
        requester: true,
        pool: { driver: true, vehicle: { owner: true } },
        poolMember: true,
        statusHistory: true,
      },
      order: { updatedAt: 'DESC' },
    });
  }

  async cancel(rideRequestId: string, currentUser: JwtPayload) {
    if (currentUser.role !== UserRole.PASSENGER) {
      throw new ForbiddenException('Only passengers can cancel ride requests');
    }

    return this.dataSource.transaction(async (manager) => {
      const rideRequest = await manager.findOne(RideRequest, {
        where: { id: rideRequestId },
        relations: { requester: true, pool: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!rideRequest) {
        throw new NotFoundException('Ride request not found');
      }
      if (rideRequest.requester.id !== currentUser.sub) {
        throw new ForbiddenException('Passenger does not own this ride request');
      }
      if (
        ![RideRequestStatus.REQUESTED, RideRequestStatus.MATCHED].includes(
          rideRequest.status,
        )
      ) {
        throw new ConflictException(
          `Cannot cancel ride from ${rideRequest.status} status`,
        );
      }

      if (rideRequest.pool) {
        const poolMember = await manager.findOne(PoolMember, {
          where: { rideRequest: { id: rideRequest.id } },
          lock: { mode: 'pessimistic_write' },
        });

        if (poolMember) {
          rideRequest.pool.totalFare = Math.max(
            0,
            (rideRequest.pool.totalFare ?? 0) - poolMember.fare,
          );
          await manager.remove(poolMember);
          const remainingMembers = await manager.find(PoolMember, {
            where: { pool: { id: rideRequest.pool.id } },
          });
          const remainingSeats = remainingMembers.reduce(
            (total, member) => total + member.requestedSeats,
            0,
          );
          rideRequest.pool.status =
            remainingSeats >= rideRequest.pool.maxMembers
              ? PoolStatus.FULL
              : PoolStatus.OPEN;
          await manager.save(rideRequest.pool);
        }

        rideRequest.pool = null;
      }

      rideRequest.status = RideRequestStatus.CANCELLED;
      const history = manager.create(RideStatusHistory, {
        rideRequest,
        changedBy: rideRequest.requester,
        status: RideRequestStatus.CANCELLED,
        note: 'Ride cancelled by passenger',
      });

      await manager.save(rideRequest);
      await manager.save(history);

      return {
        rideRequestId: rideRequest.id,
        status: rideRequest.status,
      };
    });
  }

  private ensurePassenger(currentUser: JwtPayload): void {
    if (currentUser.role !== UserRole.PASSENGER) {
      throw new ForbiddenException('Passenger access is required');
    }
  }
}