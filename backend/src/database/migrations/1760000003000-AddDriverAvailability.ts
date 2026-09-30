import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDriverAvailability1760000003000 implements MigrationInterface {
  name = 'AddDriverAvailability1760000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'is_online',
        type: 'boolean',
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'is_online');
  }
}