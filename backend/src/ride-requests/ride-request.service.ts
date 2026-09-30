import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtPayload } from '../auth/auth.types';
import { UserRole, RideRequestStatus } from '../database/enums';
import { RideRequest } from '../database/entities/ride-request.entity';
import { CreateRideRequestDto } from './dto/create-ride-request.dto';
import { FareCalculationService } from './fare-calculation.service';

@Injectable()
export class RideRequestService {
  constructor(
    @InjectRepository(RideRequest)
    private readonly rideRequestRepository: Repository<RideRequest>,
    private readonly fareCalculationService: FareCalculationService,
  ) {}

  async create(dto: CreateRideRequestDto, currentUser: JwtPayload) {
    if (currentUser.role !== UserRole.PASSENGER) {
      throw new ForbiddenException('Only passengers can create ride requests');
    }

    const estimatedFare = this.fareCalculationService.calculate(
      dto.estimatedDistanceKm,
      dto.requestedSeats,
    );
    const rideRequest = this.rideRequestRepository.create({
      requester: { id: currentUser.sub },
      pickupArea: dto.pickupArea,
      destinationArea: dto.destinationArea,
      requestedSeats: dto.requestedSeats,
      estimatedDistanceKm: dto.estimatedDistanceKm,
      estimatedFare,
      requestedFor: new Date(),
      status: RideRequestStatus.REQUESTED,
      pool: null,
    });

    return this.rideRequestRepository.save(rideRequest);
  }
}