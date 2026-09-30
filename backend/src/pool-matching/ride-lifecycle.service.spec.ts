import { ConflictException, ForbiddenException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { JwtPayload } from '../auth/auth.types';
import { Pool } from '../database/entities/pool.entity';
import { RideRequest } from '../database/entities/ride-request.entity';
import { RideStatusHistory } from '../database/entities/ride-status-history.entity';
import { User } from '../database/entities/user.entity';
import { Vehicle } from '../database/entities/vehicle.entity';
import { RideRequestStatus, UserRole } from '../database/enums';
import { RideLifecycleService } from './ride-lifecycle.service';

const driver: JwtPayload = {
  sub: 'driver-id',
  email: 'driver@example.com',
  role: UserRole.DRIVER,
};

const makeRide = (status: RideRequestStatus): RideRequest =>
  ({
    id: 'ride-id',
    status,
    pool: {
      vehicle: { owner: { id: driver.sub } as User } as Vehicle,
    } as Pool,
  }) as RideRequest;

const makeService = (ride: RideRequest) => {
  const saved: unknown[] = [];
  const manager = {
    findOne: jest.fn(async () => ride),
    create: jest.fn((_entity: typeof RideStatusHistory, value: object) => value),
    save: jest.fn(async (value: unknown) => {
      saved.push(value);
      return value;
    }),
  } as unknown as EntityManager;
  const dataSource = {
    transaction: async <T>(callback: (transactionManager: EntityManager) => Promise<T>) =>
      callback(manager),
  } as unknown as DataSource;

  return { service: new RideLifecycleService(dataSource), manager, saved };
};

describe('RideLifecycleService', () => {
  it('allows arrival, start, and completion in order', async () => {
    const ride = makeRide(RideRequestStatus.MATCHED);
    const { service, saved } = makeService(ride);

    await expect(service.markDriverArrived(ride.id, driver)).resolves.toEqual({
      rideRequestId: ride.id,
      status: RideRequestStatus.DRIVER_ARRIVED,
    });
    await expect(service.startRide(ride.id, driver)).resolves.toEqual({
      rideRequestId: ride.id,
      status: RideRequestStatus.STARTED,
    });
    await expect(service.completeRide(ride.id, driver)).resolves.toEqual({
      rideRequestId: ride.id,
      status: RideRequestStatus.COMPLETED,
    });

    expect(saved).toHaveLength(6);
    expect(
      saved.filter((value) => (value as RideStatusHistory).note),
    ).toHaveLength(3);
  });

  it('rejects starting before driver arrival', async () => {
    const ride = makeRide(RideRequestStatus.MATCHED);
    const { service } = makeService(ride);

    await expect(service.startRide(ride.id, driver)).rejects.toThrow(ConflictException);
  });

  it('rejects duplicate completion', async () => {
    const ride = makeRide(RideRequestStatus.STARTED);
    const { service } = makeService(ride);

    await service.completeRide(ride.id, driver);
    await expect(service.completeRide(ride.id, driver)).rejects.toThrow(ConflictException);
  });

  it('rejects a driver who does not own the pool vehicle', async () => {
    const ride = makeRide(RideRequestStatus.MATCHED);
    const { service } = makeService(ride);
    const otherDriver = { ...driver, sub: 'different-driver-id' };

    await expect(service.markDriverArrived(ride.id, otherDriver)).rejects.toThrow(
      ForbiddenException,
    );
  });
});