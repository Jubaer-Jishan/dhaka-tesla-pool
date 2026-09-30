export enum UserRole {
  PASSENGER = 'passenger',
  DRIVER = 'driver',
}

export enum RideRequestStatus {
  REQUESTED = 'requested',
  MATCHED = 'matched',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PoolStatus {
  OPEN = 'open',
  FULL = 'full',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PoolMemberStatus {
  REQUESTED = 'requested',
  CONFIRMED = 'confirmed',
  DECLINED = 'declined',
  CANCELLED = 'cancelled',
}