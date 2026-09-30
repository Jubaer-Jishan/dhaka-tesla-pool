import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/auth.types';
import { CreateRideRequestDto } from './dto/create-ride-request.dto';
import { RideRequestService } from './ride-request.service';

@Controller('ride-requests')
@UseGuards(JwtAuthGuard)
export class RideRequestController {
  constructor(private readonly rideRequestService: RideRequestService) {}

  @Post()
  create(
    @Body() dto: CreateRideRequestDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.rideRequestService.create(dto, currentUser);
  }
}