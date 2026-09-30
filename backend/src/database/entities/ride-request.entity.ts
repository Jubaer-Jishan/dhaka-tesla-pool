import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RideRequestStatus } from '../enums';
import { Pool } from './pool.entity';
import { PoolMember } from './pool-member.entity';
import { RideStatusHistory } from './ride-status-history.entity';
import { User } from './user.entity';

@Entity('ride_requests')
export class RideRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.rideRequests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @ManyToOne(() => Pool, (pool) => pool.rideRequests, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'pool_id' })
  pool: Pool | null;

  @Column({ name: 'pickup_area', type: 'varchar', length: 100 })
  pickupArea: string;

  @Column({ name: 'destination_area', type: 'varchar', length: 100 })
  destinationArea: string;

  @Column({ name: 'requested_for', type: 'timestamptz' })
  requestedFor: Date;

  @Column({ name: 'requested_seats', type: 'smallint' })
  requestedSeats: number;

  @Column({ name: 'estimated_distance_km', type: 'double precision' })
  estimatedDistanceKm: number;

  @Column({ name: 'estimated_fare', type: 'double precision' })
  estimatedFare: number;

  @Column({ type: 'enum', enum: RideRequestStatus, default: RideRequestStatus.REQUESTED })
  status: RideRequestStatus;

  @OneToMany(() => RideStatusHistory, (history) => history.rideRequest)
  statusHistory: RideStatusHistory[];

  @OneToOne(() => PoolMember, (poolMember) => poolMember.rideRequest)
  poolMember: PoolMember | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}