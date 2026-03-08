import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCnacelledAtCoumnToEventsTable1772662469068 implements MigrationInterface {
    name = 'AddCnacelledAtCoumnToEventsTable1772662469068'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`events\` ADD \`cancelled_at\` timestamp NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`events\` DROP COLUMN \`cancelled_at\``);
    }

}
