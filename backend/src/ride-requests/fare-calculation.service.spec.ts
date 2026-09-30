import { FareCalculationService } from './fare-calculation.service';

describe('FareCalculationService', () => {
  it('calculates a fare from distance and requested seats', () => {
    const service = new FareCalculationService();

    expect(service.calculate(10, 2)).toBe(270);
  });
});