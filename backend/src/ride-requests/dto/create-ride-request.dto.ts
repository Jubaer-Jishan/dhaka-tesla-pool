import { IsIn, IsInt, IsNumber, Max, Min } from 'class-validator';
import { DHAKA_AREAS } from '../dhaka-areas';

export class CreateRideRequestDto {
  @IsIn(DHAKA_AREAS)
  pickupArea: string;

  @IsIn(DHAKA_AREAS)
  destinationArea: string;

  @IsInt()
  @Min(1)
  @Max(6)
  requestedSeats: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  estimatedDistanceKm: number;
}