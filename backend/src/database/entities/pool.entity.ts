import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PoolStatus } from '../enums';
import { PoolMember } from './pool-member.entity';
import { RideRequest } from './ride-request.entity';
import { User } from './user.entity';
import { Vehicle } from './vehicle.entity';

@Entity('pools')
export class Pool {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.pools, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  @ManyToOne(() => Vehicle, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ type: 'varchar', length: 255 })
  origin: string;

  @Column({ type: 'varchar', length: 255 })
  destination: string;

  @Column({ name: 'departure_time', type: 'timestamptz' })
  departureTime: Date;

  @Column({ name: 'max_members', type: 'smallint', default: 3 })
  maxMembers: number;

  @Column({ type: 'enum', enum: PoolStatus, default: PoolStatus.OPEN })
  status: PoolStatus;

  @Column({ name: 'total_fare', type: 'double precision', default: 0 })
  totalFare: number;

  @OneToMany(() => PoolMember, (poolMember) => poolMember.pool)
  members: PoolMember[];

  @OneToMany(() => RideRequest, (rideRequest) => rideRequest.pool)
  rideRequests: RideRequest[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}