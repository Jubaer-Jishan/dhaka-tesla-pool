import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository, UpdateResult } from 'typeorm';
import { JwtPayload } from '../auth/auth.types';
import { Pool } from '../database/entities/pool.entity';
import { PoolMember } from '../database/entities/pool-member.entity';
import { User } from '../database/entities/user.entity';
import { Vehicle } from '../database/entities/vehicle.entity';
import { UserRole } from '../database/enums';
import { UpdateDriverStatusDto } from './dto/update-driver-status.dto';
import { DriverService } from './driver.service';

jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

const driver: JwtPayload = {
  sub: 'driver-id',
  email: 'driver@example.com',
  role: UserRole.DRIVER,
};

describe('DriverService', () => {
  it('rejects passenger status updates', async () => {
    const userRepository = { update: jest.fn() } as unknown as Repository<User>;
    const vehicleRepository = { findOne: jest.fn() } as unknown as Repository<Vehicle>;
    const service = new DriverService(
      userRepository,
      vehicleRepository,
      {} as Repository<Pool>,
      {} as Repository<PoolMember>,
    );
    const passenger = { ...driver, role: UserRole.PASSENGER };

    await expect(
      service.updateStatus(passenger, { isOnline: true } as UpdateDriverStatusDto),
    ).rejects.toThrow(ForbiddenException);
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('looks up only the authenticated driver owner vehicle', async () => {
    const vehicle = { id: 'vehicle-id', licensePlate: 'DHAKA-1234' } as Vehicle;
    const findOne = jest.fn(async (options: { where: { owner: { id: string } } }) =>
      options.where.owner.id === driver.sub ? vehicle : null,
    );
    const userRepository = { update: jest.fn() } as unknown as Repository<User>;
    const vehicleRepository = { findOne } as unknown as Repository<Vehicle>;
    const service = new DriverService(
      userRepository,
      vehicleRepository,
      {} as Repository<Pool>,
      {} as Repository<PoolMember>,
    );

    await expect(service.getAssignedVehicle(driver)).resolves.toBe(vehicle);
    expect(findOne).toHaveBeenCalledWith({ where: { owner: { id: driver.sub } } });
  });

  it('does not expose a vehicle owned by another driver', async () => {
    const findOne = jest.fn(async () => null);
    const userRepository = { update: jest.fn() } as unknown as Repository<User>;
    const vehicleRepository = { findOne } as unknown as Repository<Vehicle>;
    const service = new DriverService(
      userRepository,
      vehicleRepository,
      {} as Repository<Pool>,
      {} as Repository<PoolMember>,
    );

    await expect(service.getAssignedVehicle(driver)).rejects.toThrow(NotFoundException);
  });

  it('updates only the authenticated driver status', async () => {
    const update = jest.fn(async (): Promise<UpdateResult> => ({
      affected: 1,
      generatedMaps: [],
      raw: [],
    }));
    const userRepository = { update } as unknown as Repository<User>;
    const vehicleRepository = { findOne: jest.fn() } as unknown as Repository<Vehicle>;
    const service = new DriverService(
      userRepository,
      vehicleRepository,
      {} as Repository<Pool>,
      {} as Repository<PoolMember>,
    );

    await expect(service.updateStatus(driver, { isOnline: true })).resolves.toEqual({
      isOnline: true,
    });
    expect(update).toHaveBeenCalledWith(driver.sub, { isOnline: true });
  });

  it('rejects passenger access to driver ride reads', async () => {
    const userRepository = { update: jest.fn() } as unknown as Repository<User>;
    const vehicleRepository = { findOne: jest.fn() } as unknown as Repository<Vehicle>;
    const poolRepository = { findOne: jest.fn() } as unknown as Repository<Pool>;
    const poolMemberRepository = { find: jest.fn() } as unknown as Repository<PoolMember>;
    const service = new DriverService(
      userRepository,
      vehicleRepository,
      poolRepository,
      poolMemberRepository,
    );
    const passenger = { ...driver, role: UserRole.PASSENGER };

    await expect(service.getCurrent(passenger)).rejects.toThrow(ForbiddenException);
    await expect(service.getHistory(passenger)).rejects.toThrow(ForbiddenException);
    expect(poolRepository.findOne).not.toHaveBeenCalled();
    expect(poolMemberRepository.find).not.toHaveBeenCalled();
  });

  it('returns clean empty results when the driver has no current pool or ride history', async () => {
    const userRepository = { update: jest.fn() } as unknown as Repository<User>;
    const vehicleRepository = { findOne: jest.fn() } as unknown as Repository<Vehicle>;
    const poolRepository = { findOne: jest.fn(async () => null) } as unknown as Repository<Pool>;
    const poolMemberRepository = {
      find: jest.fn(async () => []),
    } as unknown as Repository<PoolMember>;
    const service = new DriverService(
      userRepository,
      vehicleRepository,
      poolRepository,
      poolMemberRepository,
    );

    await expect(service.getCurrent(driver)).resolves.toBeNull();
    await expect(service.getHistory(driver)).resolves.toEqual([]);
    expect(poolRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ driver: { id: driver.sub } }) }),
    );
    expect(poolMemberRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ pool: { driver: { id: driver.sub } } }),
      }),
    );
  });
});