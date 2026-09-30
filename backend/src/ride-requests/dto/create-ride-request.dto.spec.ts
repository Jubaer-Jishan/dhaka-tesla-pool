import { validate } from 'class-validator';
import { CreateRideRequestDto } from './create-ride-request.dto';

describe('CreateRideRequestDto', () => {
  it('rejects invalid Dhaka areas and non-positive seats', async () => {
    const dto = Object.assign(new CreateRideRequestDto(), {
      pickupArea: 'London',
      destinationArea: 'Unknown Area',
      requestedSeats: 0,
      estimatedDistanceKm: 4.5,
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['pickupArea', 'destinationArea', 'requestedSeats']),
    );
  });

  it('accepts valid areas, seats, and distance', async () => {
    const dto = Object.assign(new CreateRideRequestDto(), {
      pickupArea: 'Uttara',
      destinationArea: 'Gulshan',
      requestedSeats: 2,
      estimatedDistanceKm: 12.25,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});