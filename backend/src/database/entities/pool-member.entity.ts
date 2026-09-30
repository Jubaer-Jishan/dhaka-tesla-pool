import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { PoolMemberStatus } from '../enums';
import { Pool } from './pool.entity';
import { RideRequest } from './ride-request.entity';
import { User } from './user.entity';

@Entity('pool_members')
@Unique(['pool', 'user'])
export class PoolMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Pool, (pool) => pool.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pool_id' })
  pool: Pool;

  @ManyToOne(() => User, (user) => user.poolMembers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToOne(() => RideRequest, (rideRequest) => rideRequest.poolMember, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ride_request_id' })
  rideRequest: RideRequest;

  @Column({ name: 'requested_seats', type: 'smallint' })
  requestedSeats: number;

  @Column({ type: 'double precision' })
  fare: number;

  @Column({ type: 'enum', enum: PoolMemberStatus, default: PoolMemberStatus.REQUESTED })
  status: PoolMemberStatus;

  @Column({ name: 'joined_at', type: 'timestamptz', nullable: true })
  joinedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}