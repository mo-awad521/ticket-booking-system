import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePaymentsTable1780924301228 implements MigrationInterface {
    name = 'UpdatePaymentsTable1780924301228'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" ADD "client_secret" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "failure_reason" text`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "provider" SET DEFAULT 'stripe'`);
        await queryRunner.query(`ALTER TYPE "public"."payments_status_enum" RENAME TO "payments_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'succeeded', 'failed', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" TYPE "public"."payments_status_enum" USING "status"::"text"::"public"."payments_status_enum"`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_9670987a405c3f3a93b3ac08a4" ON "payments" ("provider_payment_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_9670987a405c3f3a93b3ac08a4"`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum_old" AS ENUM('pending', 'succeeded', 'failed')`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" TYPE "public"."payments_status_enum_old" USING "status"::"text"::"public"."payments_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."payments_status_enum_old" RENAME TO "payments_status_enum"`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "provider" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "failure_reason"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "client_secret"`);
    }

}
