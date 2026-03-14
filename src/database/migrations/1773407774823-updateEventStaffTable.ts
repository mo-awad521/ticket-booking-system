import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEventStaffTable1773407774823 implements MigrationInterface {
    name = 'UpdateEventStaffTable1773407774823'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`event_staff_assignments\` ADD CONSTRAINT \`FK_43b699824526e0141952c154b7c\` FOREIGN KEY (\`staff_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`event_staff_assignments\` DROP FOREIGN KEY \`FK_43b699824526e0141952c154b7c\``);
    }

}
