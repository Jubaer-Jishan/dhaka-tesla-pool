import { Controller, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DriverRoleGuard } from '../drivers/guards/driver-role.guard';
import { RideLifecycleService } from './ride-lifecycle.service';

@Controller('ride-requests')
@UseGuards(JwtAuthGuard, DriverRoleGuard)
export class RideLifecycleController {
  constructor(private readonly rideLifecycleService: RideLifecycleService) {}

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