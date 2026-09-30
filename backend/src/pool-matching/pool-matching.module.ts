import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { User } from '../database/entities/user.entity';
import { Pool } from '../database/entities/pool.entity';
import { PoolMember } from '../database/entities/pool-member.entity';
import { RideRequest } from '../database/entities/ride-request.entity';
import { Vehicle } from '../database/entities/vehicle.entity';
import { DriversModule } from '../drivers/drivers.module';
import { FareCalculationService } from '../ride-requests/fare-calculation.service';
import { RideMatchingController } from './ride-matching.controller';
import { RideMatchingService } from './ride-matching.service';
import { RideLifecycleService } from './ride-lifecycle.service';
import { RideLifecycleController } from './ride-lifecycle.controller';
import { RouteCompatibilityService } from './route-compatibility.service';

@Module({
  imports: [
    AuthModule,
    DriversModule,
    TypeOrmModule.forFeature([User, Pool, PoolMember, RideRequest, Vehicle]),
  ],
  controllers: [RideMatchingController, RideLifecycleController],
  providers: [
    FareCalculationService,
    RideMatchingService,
    RideLifecycleService,
    RouteCompatibilityService,
  ],
})
export class PoolMatchingModule {}