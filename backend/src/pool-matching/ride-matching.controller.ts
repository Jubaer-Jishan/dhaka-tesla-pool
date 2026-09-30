import { Controller, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/auth.types';
import { DriverRoleGuard } from '../drivers/guards/driver-role.guard';
import { RideMatchingService } from './ride-matching.service';
import { RideLifecycleService } from './ride-lifecycle.service';

@Controller('ride-requests')
@UseGuards(JwtAuthGuard, DriverRoleGuard)
export class RideMatchingController {
  constructor(
    private readonly rideMatchingService: RideMatchingService,
    private readonly rideLifecycleService: RideLifecycleService,
  ) {}

  @Post(':rideRequestId/accept')
  acceptRide(
    @Param('rideRequestId', ParseUUIDPipe) rideRequestId: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.rideMatchingService.acceptRide(rideRequestId, currentUser);
  }

  @Post(':rideRequestId/arrive')
  markDriverArrived(
    @Param('rideRequestId', ParseUUIDPipe) rideRequestId: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.rideLifecycleService.markDriverArrived(rideRequestId, currentUser);
  }

  @Post(':rideRequestId/start')
  startRide(
    @Param('rideRequestId', ParseUUIDPipe) rideRequestId: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.rideLifecycleService.startRide(rideRequestId, currentUser);
  }

  @Post(':rideRequestId/complete')
  completeRide(
    @Param('rideRequestId', ParseUUIDPipe) rideRequestId: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.rideLifecycleService.completeRide(rideRequestId, currentUser);
  }
}