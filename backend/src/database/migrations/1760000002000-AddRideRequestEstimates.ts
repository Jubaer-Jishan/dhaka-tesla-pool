import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRideRequestEstimates1760000002000 implements MigrationInterface {
  name = 'AddRideRequestEstimates1760000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn('ride_requests', 'pickup_location', 'pickup_area');
    await queryRunner.renameColumn(
      'ride_requests',
      'dropoff_location',
      'destination_area',
    );
    await queryRunner.renameColumn(
      'ride_requests',
      'seats_requested',
      'requested_seats',
    );
    await queryRunner.addColumn(
      'ride_requests',
      new TableColumn({
        name: 'estimated_distance_km',
        type: 'double precision',
        isNullable: false,
      }),
    );
    await queryRunner.addColumn(
      'ride_requests',
      new TableColumn({
        name: 'estimated_fare',
        type: 'double precision',
        isNullable: false,
      }),
    );
    await queryRunner.query(
      `ALTER TYPE "public"."ride_requests_status_enum" RENAME VALUE 'pending' TO 'requested'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."ride_status_history_status_enum" RENAME VALUE 'pending' TO 'requested'`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_requests" ALTER COLUMN "status" SET DEFAULT 'requested'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ride_requests" ALTER COLUMN "status" SET DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."ride_status_history_status_enum" RENAME VALUE 'requested' TO 'pending'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."ride_requests_status_enum" RENAME VALUE 'requested' TO 'pending'`,
    );
    await queryRunner.dropColumn('ride_requests', 'estimated_fare');
    await queryRunner.dropColumn('ride_requests', 'estimated_distance_km');
    await queryRunner.renameColumn(
      'ride_requests',
      'requested_seats',
      'seats_requested',
    );
    await queryRunner.renameColumn(
      'ride_requests',
      'destination_area',
      'dropoff_location',
    );
    await queryRunner.renameColumn('ride_requests', 'pickup_area', 'pickup_location');
  }
}