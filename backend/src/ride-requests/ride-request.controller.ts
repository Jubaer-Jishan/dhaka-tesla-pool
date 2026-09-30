import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/auth.types';
import { CreateRideRequestDto } from './dto/create-ride-request.dto';
import { RideRequestService } from './ride-request.service';

@Controller('ride-requests')
@UseGuards(JwtAuthGuard)
export class RideRequestController {
  constructor(private readonly rideRequestService: RideRequestService) {}

  @Get('current')
  getCurrent(@CurrentUser() currentUser: JwtPayload) {
    return this.rideRequestService.getCurrent(currentUser);
  }

  @Get('history')
  getHistory(@CurrentUser() currentUser: JwtPayload) {
    return this.rideRequestService.getHistory(currentUser);
  }

  @Post()
  create(
    @Body() dto: CreateRideRequestDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.rideRequestService.create(dto, currentUser);
  }

  @Post(':rideRequestId/cancel')
  cancel(
    @Param('rideRequestId') rideRequestId: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.rideRequestService.cancel(rideRequestId, currentUser);
  }
}