import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/auth.types';
import { DriverRoleGuard } from './guards/driver-role.guard';
import { UpdateDriverStatusDto } from './dto/update-driver-status.dto';
import { DriverService } from './driver.service';

@Controller('driver')
@UseGuards(JwtAuthGuard, DriverRoleGuard)
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Get('current')
  getCurrent(@CurrentUser() currentUser: JwtPayload) {
    return this.driverService.getCurrent(currentUser);
  }

  @Get('history')
  getHistory(@CurrentUser() currentUser: JwtPayload) {
    return this.driverService.getHistory(currentUser);
  }

  @Patch('status')
  updateStatus(
    @Body() dto: UpdateDriverStatusDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.driverService.updateStatus(currentUser, dto);
  }

  @Get('vehicle')
  getAssignedVehicle(@CurrentUser() currentUser: JwtPayload) {
    return this.driverService.getAssignedVehicle(currentUser);
  }
}