import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableUnique,
} from 'typeorm';

export class AddPoolMatchingFields1760000004000 implements MigrationInterface {
  name = 'AddPoolMatchingFields1760000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'pools',
      new TableColumn({
        name: 'total_fare',
        type: 'double precision',
        default: 0,
      }),
    );
    await queryRunner.addColumn(
      'pool_members',
      new TableColumn({
        name: 'ride_request_id',
        type: 'uuid',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'pool_members',
      new TableColumn({
        name: 'requested_seats',
        type: 'smallint',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'pool_members',
      new TableColumn({
        name: 'fare',
        type: 'double precision',
        isNullable: true,
      }),
    );
    await queryRunner.createUniqueConstraint(
      'pool_members',
      new TableUnique({ name: 'UQ_pool_members_ride_request', columnNames: ['ride_request_id'] }),
    );
    await queryRunner.createForeignKey(
      'pool_members',
      new TableForeignKey({
        name: 'FK_pool_members_ride_request',
        columnNames: ['ride_request_id'],
        referencedTableName: 'ride_requests',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('pool_members', 'FK_pool_members_ride_request');
    await queryRunner.dropUniqueConstraint('pool_members', 'UQ_pool_members_ride_request');
    await queryRunner.dropColumn('pool_members', 'fare');
    await queryRunner.dropColumn('pool_members', 'requested_seats');
    await queryRunner.dropColumn('pool_members', 'ride_request_id');
    await queryRunner.dropColumn('pools', 'total_fare');
  }
}