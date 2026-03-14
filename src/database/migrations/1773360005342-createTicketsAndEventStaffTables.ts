import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTicketsAndEventStaffTables1773360005342 implements MigrationInterface {
    name = 'CreateTicketsAndEventStaffTables1773360005342'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`tickets\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`order_id\` varchar(255) NOT NULL, \`ticket_type_id\` varchar(255) NOT NULL, \`event_id\` varchar(255) NOT NULL, \`code\` varchar(64) NOT NULL, \`qr_code_url\` varchar(500) NULL, \`status\` enum ('valid', 'used', 'cancelled') NOT NULL DEFAULT 'valid', \`used_at\` timestamp NULL, INDEX \`IDX_bd5636236f799b19f132abf8d7\` (\`order_id\`), INDEX \`IDX_a95369aeea12da7fde110e95e0\` (\`ticket_type_id\`), INDEX \`IDX_bd5387c23fb40ae7e3526ad75e\` (\`event_id\`), UNIQUE INDEX \`IDX_c6e20a830c0f8b571abd331b77\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`tickets\` ADD CONSTRAINT \`FK_bd5636236f799b19f132abf8d70\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tickets\` ADD CONSTRAINT \`FK_a95369aeea12da7fde110e95e00\` FOREIGN KEY (\`ticket_type_id\`) REFERENCES \`ticket_types\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tickets\` ADD CONSTRAINT \`FK_bd5387c23fb40ae7e3526ad75ea\` FOREIGN KEY (\`event_id\`) REFERENCES \`events\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`event_staff_assignments\` ADD CONSTRAINT \`FK_cefb8e8bc7e59bf4a67a37f3658\` FOREIGN KEY (\`event_id\`) REFERENCES \`events\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`event_staff_assignments\` DROP FOREIGN KEY \`FK_cefb8e8bc7e59bf4a67a37f3658\``);
        await queryRunner.query(`ALTER TABLE \`tickets\` DROP FOREIGN KEY \`FK_bd5387c23fb40ae7e3526ad75ea\``);
        await queryRunner.query(`ALTER TABLE \`tickets\` DROP FOREIGN KEY \`FK_a95369aeea12da7fde110e95e00\``);
        await queryRunner.query(`ALTER TABLE \`tickets\` DROP FOREIGN KEY \`FK_bd5636236f799b19f132abf8d70\``);
        await queryRunner.query(`DROP INDEX \`IDX_c6e20a830c0f8b571abd331b77\` ON \`tickets\``);
        await queryRunner.query(`DROP INDEX \`IDX_bd5387c23fb40ae7e3526ad75e\` ON \`tickets\``);
        await queryRunner.query(`DROP INDEX \`IDX_a95369aeea12da7fde110e95e0\` ON \`tickets\``);
        await queryRunner.query(`DROP INDEX \`IDX_bd5636236f799b19f132abf8d7\` ON \`tickets\``);
        await queryRunner.query(`DROP TABLE \`tickets\``);
    }

}
