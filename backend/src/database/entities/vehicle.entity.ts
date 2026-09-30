import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.vehicles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ type: 'varchar', length: 80 })
  make: string;

  @Column({ type: 'varchar', length: 80 })
  model: string;

  @Column({ type: 'smallint', nullable: true })
  year: number | null;

  @Column({ type: 'varchar', length: 40 })
  color: string;

  @Column({ name: 'license_plate', type: 'varchar', length: 30, unique: true })
  licensePlate: string;

  @Column({ name: 'seating_capacity', type: 'smallint', default: 4 })
  seatingCapacity: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}