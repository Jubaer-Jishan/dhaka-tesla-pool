import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RideRequest } from '../database/entities/ride-request.entity';
import { FareCalculationService } from './fare-calculation.service';
import { RideRequestController } from './ride-request.controller';
import { RideRequestService } from './ride-request.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([RideRequest])],
  controllers: [RideRequestController],
  providers: [FareCalculationService, RideRequestService],
})
export class RideRequestsModule {}