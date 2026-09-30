import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { PoolMemberStatus, PoolStatus, RideRequestStatus, UserRole } from '../enums';

export class InitialSchema1760000000000 implements MigrationInterface {
  name = 'InitialSchema1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
          { name: 'full_name', type: 'varchar', length: '120' },
          { name: 'email', type: 'varchar', length: '255', isUnique: true },
          { name: 'phone', type: 'varchar', length: '30', isUnique: true },
          { name: 'role', type: 'enum', enum: Object.values(UserRole), default: `'${UserRole.PASSENGER}'` },
          { name: 'is_online', type: 'boolean', default: false },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'vehicles',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
          { name: 'owner_id', type: 'uuid' },
          { name: 'make', type: 'varchar', length: '80' },
          { name: 'model', type: 'varchar', length: '80' },
          { name: 'year', type: 'smallint', isNullable: true },
          { name: 'color', type: 'varchar', length: '40' },
          { name: 'license_plate', type: 'varchar', length: '30', isUnique: true },
          { name: 'seating_capacity', type: 'smallint', default: '4' },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
        foreignKeys: [{ columnNames: ['owner_id'], referencedTableName: 'users', referencedColumnNames: ['id'], onDelete: 'CASCADE' }],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'pools',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
          { name: 'driver_id', type: 'uuid' },
          { name: 'vehicle_id', type: 'uuid' },
          { name: 'origin', type: 'varchar', length: '255' },
          { name: 'destination', type: 'varchar', length: '255' },
          { name: 'departure_time', type: 'timestamptz' },
          { name: 'max_members', type: 'smallint', default: '3' },
          { name: 'status', type: 'enum', enum: Object.values(PoolStatus), default: `'${PoolStatus.OPEN}'` },
          { name: 'total_fare', type: 'double precision', default: 0 },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
        foreignKeys: [
          { columnNames: ['driver_id'], referencedTableName: 'users', referencedColumnNames: ['id'], onDelete: 'RESTRICT' },
          { columnNames: ['vehicle_id'], referencedTableName: 'vehicles', referencedColumnNames: ['id'], onDelete: 'RESTRICT' },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'ride_requests',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
          { name: 'requester_id', type: 'uuid' },
          { name: 'pool_id', type: 'uuid', isNullable: true },
          { name: 'pickup_area', type: 'varchar', length: '100' },
          { name: 'destination_area', type: 'varchar', length: '100' },
          { name: 'requested_for', type: 'timestamptz' },
          { name: 'requested_seats', type: 'smallint' },
          { name: 'estimated_distance_km', type: 'double precision' },
          { name: 'estimated_fare', type: 'double precision' },
          { name: 'status', type: 'enum', enum: Object.values(RideRequestStatus), default: `'${RideRequestStatus.REQUESTED}'` },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
        foreignKeys: [
          { columnNames: ['requester_id'], referencedTableName: 'users', referencedColumnNames: ['id'], onDelete: 'CASCADE' },
          { columnNames: ['pool_id'], referencedTableName: 'pools', referencedColumnNames: ['id'], onDelete: 'SET NULL' },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'pool_members',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
          { name: 'pool_id', type: 'uuid' },
          { name: 'user_id', type: 'uuid' },
          { name: 'ride_request_id', type: 'uuid', isUnique: true },
          { name: 'requested_seats', type: 'smallint' },
          { name: 'fare', type: 'double precision' },
          { name: 'status', type: 'enum', enum: Object.values(PoolMemberStatus), default: `'${PoolMemberStatus.REQUESTED}'` },
          { name: 'joined_at', type: 'timestamptz', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
        uniques: [{ columnNames: ['pool_id', 'user_id'] }],
        foreignKeys: [
          { columnNames: ['pool_id'], referencedTableName: 'pools', referencedColumnNames: ['id'], onDelete: 'CASCADE' },
          { columnNames: ['user_id'], referencedTableName: 'users', referencedColumnNames: ['id'], onDelete: 'CASCADE' },
          { columnNames: ['ride_request_id'], referencedTableName: 'ride_requests', referencedColumnNames: ['id'], onDelete: 'CASCADE' },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'ride_status_history',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
          { name: 'ride_request_id', type: 'uuid' },
          { name: 'changed_by_id', type: 'uuid', isNullable: true },
          { name: 'status', type: 'enum', enum: Object.values(RideRequestStatus) },
          { name: 'note', type: 'varchar', length: '255', isNullable: true },
          { name: 'changed_at', type: 'timestamptz', default: 'now()' },
        ],
        foreignKeys: [
          { columnNames: ['ride_request_id'], referencedTableName: 'ride_requests', referencedColumnNames: ['id'], onDelete: 'CASCADE' },
          { columnNames: ['changed_by_id'], referencedTableName: 'users', referencedColumnNames: ['id'], onDelete: 'SET NULL' },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('ride_status_history');
    await queryRunner.dropTable('pool_members');
    await queryRunner.dropTable('ride_requests');
    await queryRunner.dropTable('pools');
    await queryRunner.dropTable('vehicles');
    await queryRunner.dropTable('users');
  }
}