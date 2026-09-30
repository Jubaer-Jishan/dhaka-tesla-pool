import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../enums';
import { Pool } from './pool.entity';
import { PoolMember } from './pool-member.entity';
import { RideRequest } from './ride-request.entity';
import { RideStatusHistory } from './ride-status-history.entity';
import { Vehicle } from './vehicle.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name', type: 'varchar', length: 120 })
  fullName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  phone: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.PASSENGER })
  role: UserRole;

  @Column({ name: 'is_online', type: 'boolean', default: false })
  isOnline: boolean;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.owner)
  vehicles: Vehicle[];

  @OneToMany(() => RideRequest, (rideRequest) => rideRequest.requester)
  rideRequests: RideRequest[];

  @OneToMany(() => Pool, (pool) => pool.driver)
  pools: Pool[];

  @OneToMany(() => PoolMember, (poolMember) => poolMember.user)
  poolMembers: PoolMember[];

  @OneToMany(() => RideStatusHistory, (history) => history.changedBy)
  rideStatusChanges: RideStatusHistory[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}