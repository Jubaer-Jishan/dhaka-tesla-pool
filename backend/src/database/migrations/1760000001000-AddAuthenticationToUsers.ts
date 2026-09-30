import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAuthenticationToUsers1760000001000 implements MigrationInterface {
  name = 'AddAuthenticationToUsers1760000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const enumValues = await queryRunner.query(
      `SELECT enumlabel FROM pg_enum WHERE enumtypid = 'public.users_role_enum'::regtype`,
    );
    const labels = enumValues.map((value: { enumlabel: string }) => value.enumlabel);
    if (labels.includes('rider') && !labels.includes('passenger')) {
      await queryRunner.query(
        `ALTER TYPE "public"."users_role_enum" RENAME VALUE 'rider' TO 'passenger'`,
      );
    }
    if (labels.includes('rider') || labels.includes('passenger')) {
      await queryRunner.query(
        `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'passenger'`,
      );
    }
    if (!(await queryRunner.hasColumn('users', 'password_hash'))) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'password_hash',
          type: 'varchar',
          length: '255',
          isNullable: false,
          default: "''",
        }),
      );
      await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password_hash" DROP DEFAULT`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'password_hash');
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'rider'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" RENAME VALUE 'passenger' TO 'rider'`,
    );
  }
}