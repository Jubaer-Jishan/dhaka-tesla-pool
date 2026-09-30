import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { User } from '../database/entities/user.entity';
import { Vehicle } from '../database/entities/vehicle.entity';
import { Pool } from '../database/entities/pool.entity';
import { PoolMember } from '../database/entities/pool-member.entity';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';
import { DriverRoleGuard } from './guards/driver-role.guard';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([User, Vehicle, Pool, PoolMember]),
  ],
  controllers: [DriverController],
  providers: [DriverService, DriverRoleGuard],
  exports: [DriverRoleGuard],
})
export class DriversModule {}