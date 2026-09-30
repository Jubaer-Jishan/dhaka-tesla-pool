import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { JwtPayload } from '../auth/auth.types';
import { Pool } from '../database/entities/pool.entity';
import { PoolMember } from '../database/entities/pool-member.entity';
import { RideRequest } from '../database/entities/ride-request.entity';
import { RideStatusHistory } from '../database/entities/ride-status-history.entity';
import { Vehicle } from '../database/entities/vehicle.entity';
import {
  PoolMemberStatus,
  PoolStatus,
  RideRequestStatus,
  UserRole,
} from '../database/enums';
import { FareCalculationService } from '../ride-requests/fare-calculation.service';
import { RouteCompatibilityService } from './route-compatibility.service';

@Injectable()
export class RideMatchingService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly fareCalculationService: FareCalculationService,
    private readonly routeCompatibilityService: RouteCompatibilityService,
  ) {}

  async acceptRide(rideRequestId: string, currentUser: JwtPayload) {
    if (currentUser.role !== UserRole.DRIVER) {
      throw new ForbiddenException('Driver access is required');
    }

    return this.dataSource.transaction(async (manager) => {
      const rideRequest = await manager.findOne(RideRequest, {
        where: { id: rideRequestId },
        relations: { requester: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!rideRequest) {
        throw new NotFoundException('Ride request not found');
      }
      if (rideRequest.status !== RideRequestStatus.REQUESTED) {
        throw new ConflictException('Only requested rides can be accepted');
      }

      const vehicle = await manager.findOne(Vehicle, {
        where: { owner: { id: currentUser.sub } },
        relations: { owner: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!vehicle) {
        throw new NotFoundException('No vehicle is assigned to this driver');
      }
      if (!vehicle.owner.isOnline) {
        throw new ForbiddenException('Driver must be online to accept rides');
      }
      if (rideRequest.requestedSeats > vehicle.seatingCapacity) {
        throw new ConflictException('Requested seats exceed vehicle capacity');
      }

      const activePools = await manager.find(Pool, {
        where: {
          vehicle: { id: vehicle.id },
          status: In([PoolStatus.OPEN, PoolStatus.FULL]),
        },
        relations: { members: true },
      });
      const activeSeats = activePools.reduce(
        (total, pool) =>
          total + pool.members.reduce((seats, member) => seats + member.requestedSeats, 0),
        0,
      );

      if (activeSeats + rideRequest.requestedSeats > vehicle.seatingCapacity) {
        throw new ConflictException('Vehicle capacity would be exceeded');
      }

      let pool = activePools.find(
        (candidate) =>
          candidate.status === PoolStatus.OPEN &&
          this.routeCompatibilityService.isCompatible(
            candidate.origin,
            candidate.destination,
            rideRequest.pickupArea,
            rideRequest.destinationArea,
          ),
      );
      const fare = this.fareCalculationService.calculate(
        rideRequest.estimatedDistanceKm,
        rideRequest.requestedSeats,
      );

      if (!pool) {
        pool = manager.create(Pool, {
          driver: vehicle.owner,
          vehicle,
          origin: rideRequest.pickupArea,
          destination: rideRequest.destinationArea,
          departureTime: rideRequest.requestedFor,
          maxMembers: vehicle.seatingCapacity,
          status: PoolStatus.OPEN,
          totalFare: 0,
          members: [],
          rideRequests: [],
        });
      }

      const currentPoolSeats = pool.members.reduce(
        (total, member) => total + member.requestedSeats,
        0,
      );
      const member = manager.create(PoolMember, {
        pool,
        user: rideRequest.requester,
        rideRequest,
        requestedSeats: rideRequest.requestedSeats,
        fare,
        status: PoolMemberStatus.CONFIRMED,
        joinedAt: new Date(),
      });
      pool.totalFare = (pool.totalFare ?? 0) + fare;
      pool.status =
        currentPoolSeats + rideRequest.requestedSeats >= vehicle.seatingCapacity
          ? PoolStatus.FULL
          : PoolStatus.OPEN;
      rideRequest.pool = pool;
      rideRequest.status = RideRequestStatus.MATCHED;
      const statusHistory = manager.create(RideStatusHistory, {
        rideRequest,
        changedBy: vehicle.owner,
        status: RideRequestStatus.MATCHED,
        note: 'Ride matched to driver pool',
      });

      await manager.save(pool);
      await manager.save(member);
      await manager.save(rideRequest);
      await manager.save(statusHistory);

      return {
        rideRequestId: rideRequest.id,
        poolId: pool.id,
        status: rideRequest.status,
        fare,
        poolTotalFare: pool.totalFare,
      };
    });
  }
}