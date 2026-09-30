import { ConflictException, ForbiddenException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { JwtPayload } from '../auth/auth.types';
import { Pool } from '../database/entities/pool.entity';
import { PoolMember } from '../database/entities/pool-member.entity';
import { RideRequest } from '../database/entities/ride-request.entity';
import { RideStatusHistory } from '../database/entities/ride-status-history.entity';
import { User } from '../database/entities/user.entity';
import { PoolStatus, RideRequestStatus, UserRole } from '../database/enums';
import { FareCalculationService } from './fare-calculation.service';
import { RideRequestService } from './ride-request.service';

const passenger: JwtPayload = {
  sub: 'passenger-id',
  email: 'passenger@example.com',
  role: UserRole.PASSENGER,
};

const makeRide = (status: RideRequestStatus, pool: Pool | null = null): RideRequest =>
  ({
    id: 'ride-id',
    status,
    requester: { id: passenger.sub } as User,
    pool,
  }) as RideRequest;

const makeService = (ride: RideRequest, poolMember: PoolMember | null = null) => {
  const saved: unknown[] = [];
  const manager = {
    findOne: jest.fn(async (entity: typeof RideRequest | typeof PoolMember) => {
      if (entity === RideRequest) return ride;
      return poolMember;
    }),
    find: jest.fn(async () => []),
    create: jest.fn((_entity: typeof RideStatusHistory, value: object) => value),
    remove: jest.fn(async (value: unknown) => value),
    save: jest.fn(async (value: unknown) => {
      saved.push(value);
      return value;
    }),
  } as unknown as EntityManager;
  const dataSource = {
    transaction: async <T>(callback: (transactionManager: EntityManager) => Promise<T>) =>
      callback(manager),
  } as unknown as DataSource;
  const repository = {
    findOne: jest.fn(async () => null),
    find: jest.fn(async () => []),
  } as unknown as Repository<RideRequest>;

  return {
    service: new RideRequestService(repository, new FareCalculationService(), dataSource),
    manager,
    repository,
    saved,
  };
};

describe('RideRequestService cancellation', () => {
  it('cancels a requested ride and records the status history', async () => {
    const ride = makeRide(RideRequestStatus.REQUESTED);
    const { service, saved } = makeService(ride);

    await expect(service.cancel(ride.id, passenger)).resolves.toEqual({
      rideRequestId: ride.id,
      status: RideRequestStatus.CANCELLED,
    });

    expect(ride.status).toBe(RideRequestStatus.CANCELLED);
    expect(saved).toHaveLength(2);
    expect(saved[1]).toEqual(
      expect.objectContaining({
        rideRequest: ride,
        changedBy: ride.requester,
        status: RideRequestStatus.CANCELLED,
      }),
    );
  });

  it('rejects cancellation after the ride has started progressing', async () => {
    const ride = makeRide(RideRequestStatus.DRIVER_ARRIVED);
    const { service } = makeService(ride);

    await expect(service.cancel(ride.id, passenger)).rejects.toThrow(ConflictException);
  });

  it('rejects cancellation by a different passenger', async () => {
    const ride = makeRide(RideRequestStatus.REQUESTED);
    const { service } = makeService(ride);
    const otherPassenger = { ...passenger, sub: 'other-passenger-id' };

    await expect(service.cancel(ride.id, otherPassenger)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('removes a matched ride from its pool and reopens freed capacity', async () => {
    const pool = {
      id: 'pool-id',
      maxMembers: 4,
      status: PoolStatus.FULL,
      totalFare: 250,
    } as Pool;
    const ride = makeRide(RideRequestStatus.MATCHED, pool);
    const poolMember = {
      id: 'member-id',
      fare: 100,
      rideRequest: ride,
    } as PoolMember;
    const { service, manager } = makeService(ride, poolMember);

    await service.cancel(ride.id, passenger);

    expect(manager.remove).toHaveBeenCalledWith(poolMember);
    expect(pool.totalFare).toBe(150);
    expect(pool.status).toBe(PoolStatus.OPEN);
    expect(ride.pool).toBeNull();
    expect(ride.status).toBe(RideRequestStatus.CANCELLED);
  });
});

describe('RideRequestService reads', () => {
  it('rejects driver access to passenger ride reads', async () => {
    const ride = makeRide(RideRequestStatus.REQUESTED);
    const { service, repository } = makeService(ride);
    const driver = { ...passenger, role: UserRole.DRIVER };

    await expect(service.getCurrent(driver)).rejects.toThrow(ForbiddenException);
    await expect(service.getHistory(driver)).rejects.toThrow(ForbiddenException);
    expect(repository.findOne).not.toHaveBeenCalled();
    expect(repository.find).not.toHaveBeenCalled();
  });

  it('returns clean empty results for a passenger without current or historical rides', async () => {
    const ride = makeRide(RideRequestStatus.REQUESTED);
    const { service, repository } = makeService(ride);

    await expect(service.getCurrent(passenger)).resolves.toBeNull();
    await expect(service.getHistory(passenger)).resolves.toEqual([]);
    expect(repository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ requester: { id: passenger.sub } }) }),
    );
    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ requester: { id: passenger.sub } }) }),
    );
  });
});