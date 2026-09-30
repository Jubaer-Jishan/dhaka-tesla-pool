import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtPayload } from '../auth/auth.types';
import { RideRequest } from '../database/entities/ride-request.entity';
import { RideStatusHistory } from '../database/entities/ride-status-history.entity';
import { RideRequestStatus, UserRole } from '../database/enums';

const allowedTransitions: Record<RideRequestStatus, RideRequestStatus[]> = {
  [RideRequestStatus.REQUESTED]: [],
  [RideRequestStatus.MATCHED]: [RideRequestStatus.DRIVER_ARRIVED],
  [RideRequestStatus.ACCEPTED]: [RideRequestStatus.DRIVER_ARRIVED],
  [RideRequestStatus.DRIVER_ARRIVED]: [RideRequestStatus.STARTED],
  [RideRequestStatus.STARTED]: [RideRequestStatus.COMPLETED],
  [RideRequestStatus.IN_PROGRESS]: [],
  [RideRequestStatus.COMPLETED]: [],
  [RideRequestStatus.CANCELLED]: [],
};

@Injectable()
export class RideLifecycleService {
  constructor(private readonly dataSource: DataSource) {}

  markDriverArrived(rideRequestId: string, currentUser: JwtPayload) {
    return this.transition(
      rideRequestId,
      RideRequestStatus.DRIVER_ARRIVED,
      currentUser,
      'Driver arrived at pickup area',
    );
  }

  startRide(rideRequestId: string, currentUser: JwtPayload) {
    return this.transition(
      rideRequestId,
      RideRequestStatus.STARTED,
      currentUser,
      'Ride started',
    );
  }

  completeRide(rideRequestId: string, currentUser: JwtPayload) {
    return this.transition(
      rideRequestId,
      RideRequestStatus.COMPLETED,
      currentUser,
      'Ride completed',
    );
  }

  private async transition(
    rideRequestId: string,
    nextStatus: RideRequestStatus,
    currentUser: JwtPayload,
    note: string,
  ) {
    if (currentUser.role !== UserRole.DRIVER) {
      throw new ForbiddenException('Driver access is required');
    }

    return this.dataSource.transaction(async (manager) => {
      const rideRequest = await manager.findOne(RideRequest, {
        where: { id: rideRequestId },
        relations: { pool: { vehicle: { owner: true } } },
        lock: { mode: 'pessimistic_write' },
      });

      if (!rideRequest) {
        throw new NotFoundException('Ride request not found');
      }
      if (!rideRequest.pool?.vehicle?.owner) {
        throw new ConflictException('Ride is not assigned to a driver pool');
      }
      if (rideRequest.pool.vehicle.owner.id !== currentUser.sub) {
        throw new ForbiddenException('Driver does not own the assigned vehicle');
      }
      if (!allowedTransitions[rideRequest.status].includes(nextStatus)) {
        throw new ConflictException(
          `Cannot transition ride from ${rideRequest.status} to ${nextStatus}`,
        );
      }

      rideRequest.status = nextStatus;
      const history = manager.create(RideStatusHistory, {
        rideRequest,
        changedBy: rideRequest.pool.vehicle.owner,
        status: nextStatus,
        note,
      });

      await manager.save(rideRequest);
      await manager.save(history);

      return {
        rideRequestId: rideRequest.id,
        status: rideRequest.status,
      };
    });
  }
}