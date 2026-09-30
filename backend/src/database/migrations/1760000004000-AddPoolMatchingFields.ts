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
    if (!(await queryRunner.hasColumn('pools', 'total_fare'))) {
      await queryRunner.addColumn('pools', new TableColumn({ name: 'total_fare', type: 'double precision', default: 0 }));
    }
    if (!(await queryRunner.hasColumn('pool_members', 'ride_request_id'))) {
      await queryRunner.addColumn('pool_members', new TableColumn({ name: 'ride_request_id', type: 'uuid', isNullable: true }));
    }
    if (!(await queryRunner.hasColumn('pool_members', 'requested_seats'))) {
      await queryRunner.addColumn('pool_members', new TableColumn({ name: 'requested_seats', type: 'smallint', isNullable: true }));
    }
    if (!(await queryRunner.hasColumn('pool_members', 'fare'))) {
      await queryRunner.addColumn('pool_members', new TableColumn({ name: 'fare', type: 'double precision', isNullable: true }));
    }
    const table = await queryRunner.getTable('pool_members');
    if (table && !table.uniques.some((unique) => unique.columnNames.length === 1 && unique.columnNames[0] === 'ride_request_id')) {
      await queryRunner.createUniqueConstraint('pool_members', new TableUnique({ name: 'UQ_pool_members_ride_request', columnNames: ['ride_request_id'] }));
    }
    if (table && !table.foreignKeys.some((foreignKey) => foreignKey.columnNames.length === 1 && foreignKey.columnNames[0] === 'ride_request_id' && foreignKey.referencedTableName === 'ride_requests')) {
      await queryRunner.createForeignKey('pool_members', new TableForeignKey({ name: 'FK_pool_members_ride_request', columnNames: ['ride_request_id'], referencedTableName: 'ride_requests', referencedColumnNames: ['id'], onDelete: 'CASCADE' }));
    }
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