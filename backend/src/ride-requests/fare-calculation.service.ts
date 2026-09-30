import { Injectable } from '@nestjs/common';

@Injectable()
export class FareCalculationService {
  private readonly baseFare = 50;
  private readonly farePerKilometer = 20;
  private readonly additionalSeatFare = 20;

  calculate(estimatedDistanceKm: number, requestedSeats: number): number {
    const fare =
      this.baseFare +
      estimatedDistanceKm * this.farePerKilometer +
      (requestedSeats - 1) * this.additionalSeatFare;

    return Math.round(fare * 100) / 100;
  }
}