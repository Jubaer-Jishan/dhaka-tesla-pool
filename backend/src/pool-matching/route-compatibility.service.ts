import { Injectable } from '@nestjs/common';

@Injectable()
export class RouteCompatibilityService {
  private readonly routeCorridors = [
    new Set(['Banani', 'Gulshan', 'Mohakhali']),
  ];

  isCompatible(
    poolPickupArea: string,
    poolDestinationArea: string,
    pickupArea: string,
    destinationArea: string,
  ): boolean {
    if (poolPickupArea !== pickupArea) {
      return false;
    }

    if (poolDestinationArea === destinationArea) {
      return true;
    }

    return this.routeCorridors.some(
      (corridor) =>
        corridor.has(poolDestinationArea) && corridor.has(destinationArea),
    );
  }
}