import { RouteCompatibilityService } from './route-compatibility.service';

describe('RouteCompatibilityService', () => {
  it('reuses a Banani route for Mohakhali and Gulshan destinations', () => {
    const service = new RouteCompatibilityService();

    expect(service.isCompatible('Banani', 'Mohakhali', 'Banani', 'Gulshan')).toBe(true);
  });

  it('rejects routes with a different pickup area', () => {
    const service = new RouteCompatibilityService();

    expect(service.isCompatible('Banani', 'Mohakhali', 'Uttara', 'Gulshan')).toBe(false);
  });
});