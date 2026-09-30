import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRideLifecycleStatuses1760000005000 implements MigrationInterface {
  name = 'AddRideLifecycleStatuses1760000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."ride_requests_status_enum" ADD VALUE IF NOT EXISTS 'driver_arrived'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."ride_requests_status_enum" ADD VALUE IF NOT EXISTS 'started'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."ride_status_history_status_enum" ADD VALUE IF NOT EXISTS 'driver_arrived'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."ride_status_history_status_enum" ADD VALUE IF NOT EXISTS 'started'`,
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL does not support removing enum values safely in place.
  }
}