import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RideRequestStatus } from '../enums';
import { RideRequest } from './ride-request.entity';
import { User } from './user.entity';

@Entity('ride_status_history')
export class RideStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RideRequest, (rideRequest) => rideRequest.statusHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ride_request_id' })
  rideRequest: RideRequest;

  @ManyToOne(() => User, (user) => user.rideStatusChanges, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'changed_by_id' })
  changedBy: User | null;

  @Column({ type: 'enum', enum: RideRequestStatus })
  status: RideRequestStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'changed_at', type: 'timestamptz' })
  changedAt: Date;
}