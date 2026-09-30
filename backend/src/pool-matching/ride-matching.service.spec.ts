import { ConflictException, ForbiddenException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { JwtPayload } from '../auth/auth.types';
import { Pool } from '../database/entities/pool.entity';
import { PoolMember } from '../database/entities/pool-member.entity';
import { RideRequest } from '../database/entities/ride-request.entity';
import { User } from '../database/entities/user.entity';
import { Vehicle } from '../database/entities/vehicle.entity';
import { PoolStatus, RideRequestStatus, UserRole } from '../database/enums';
import { FareCalculationService } from '../ride-requests/fare-calculation.service';
import { RideMatchingService } from './ride-matching.service';
import { RouteCompatibilityService } from './route-compatibility.service';

const driver: JwtPayload = {
  sub: 'driver-id',
  email: 'driver@example.com',
  role: UserRole.DRIVER,
};

const makeRide = (overrides: Partial<RideRequest> = {}): RideRequest =>
  ({
    id: 'ride-id',
    pickupArea: 'Banani',
    destinationArea: 'Mohakhali',
    requestedSeats: 2,
    estimatedDistanceKm: 5,
    estimatedFare: 170,
    requestedFor: new Date(),
    status: RideRequestStatus.REQUESTED,
    requester: { id: 'passenger-id' } as User,
    pool: null,
    ...overrides,
  }) as RideRequest;

const makeVehicle = (overrides: Partial<Vehicle> = {}): Vehicle =>
  ({
    id: 'vehicle-id',
    seatingCapacity: 4,
    owner: { id: driver.sub, isOnline: true } as User,
    ...overrides,
  }) as Vehicle;

const makeService = (ride: RideRequest, vehicle: Vehicle, pools: Pool[] = []) => {
  const findOne = jest.fn(async (entity: typeof RideRequest | typeof Vehicle) => {
    if (entity === RideRequest) return ride;
    return vehicle;
  });
  const find = jest.fn(async () => pools);
  const create = jest.fn((entity: typeof Pool | typeof PoolMember, value: object) => {
    if (entity === Pool) return { id: 'pool-id', ...value } as Pool;
    return { id: 'member-id', ...value } as PoolMember;
  });
  const save = jest.fn(async <T>(value: T) => value);
  const manager = { findOne, find, create, save } as unknown as EntityManager;
  const dataSource = {
    transaction: async <T>(callback: (transactionManager: EntityManager) => Promise<T>) =>
      callback(manager),
  } as unknown as DataSource;
  const service = new RideMatchingService(
    dataSource,
    new FareCalculationService(),
    new RouteCompatibilityService(),
  );

  return { service, findOne, find, create, save };
};

describe('RideMatchingService', () => {
  it('rejects a ride that exceeds vehicle capacity', async () => {
    const ride = makeRide({ requestedSeats: 5 });
    const { service } = makeService(ride, makeVehicle());

    await expect(service.acceptRide(ride.id, driver)).rejects.toThrow(ConflictException);
  });

  it('rejects a duplicate acceptance after the ride is matched', async () => {
    const ride = makeRide();
    const { service } = makeService(ride, makeVehicle());

    await service.acceptRide(ride.id, driver);
    await expect(service.acceptRide(ride.id, driver)).rejects.toThrow(ConflictException);
  });

  it('rejects acceptance by an offline driver', async () => {
    const ride = makeRide();
    const { service } = makeService(ride, makeVehicle({ owner: { ...driver, isOnline: false } as User }));

    await expect(service.acceptRide(ride.id, driver)).rejects.toThrow(ForbiddenException);
  });

  it('reuses a compatible Banani pool for Mohakhali and Gulshan rides', async () => {
    const ride = makeRide({ destinationArea: 'Gulshan' });
    const existingPool = {
      id: 'existing-pool-id',
      origin: 'Banani',
      destination: 'Mohakhali',
      status: PoolStatus.OPEN,
      totalFare: 0,
      members: [{ requestedSeats: 1 }],
    } as Pool;
    const { service, create } = makeService(ride, makeVehicle(), [existingPool]);

    const result = await service.acceptRide(ride.id, driver);

    expect(result.poolId).toBe(existingPool.id);
    expect(create).toHaveBeenCalledWith(PoolMember, expect.objectContaining({ pool: existingPool }));
  });

  it('uses pessimistic locks for the ride and vehicle during acceptance', async () => {
    const ride = makeRide();
    const { service, findOne } = makeService(ride, makeVehicle());

    await service.acceptRide(ride.id, driver);

    expect(findOne).toHaveBeenNthCalledWith(
      1,
      RideRequest,
      expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
    );
    expect(findOne).toHaveBeenNthCalledWith(
      2,
      Vehicle,
      expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
    );
  });
});