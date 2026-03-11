import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTicketsTable1773240114658 implements MigrationInterface {
    name = 'CreateTicketsTable1773240114658'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tickets\` DROP FOREIGN KEY \`FK_a95369aeea12da7fde110e95e00\``);
        await queryRunner.query(`ALTER TABLE \`tickets\` DROP FOREIGN KEY \`FK_bd5636236f799b19f132abf8d70\``);
        await queryRunner.query(`ALTER TABLE \`tickets\` ADD CONSTRAINT \`FK_bd5636236f799b19f132abf8d70\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tickets\` ADD CONSTRAINT \`FK_a95369aeea12da7fde110e95e00\` FOREIGN KEY (\`ticket_type_id\`) REFERENCES \`ticket_types\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tickets\` DROP FOREIGN KEY \`FK_a95369aeea12da7fde110e95e00\``);
        await queryRunner.query(`ALTER TABLE \`tickets\` DROP FOREIGN KEY \`FK_bd5636236f799b19f132abf8d70\``);
        await queryRunner.query(`ALTER TABLE \`tickets\` ADD CONSTRAINT \`FK_bd5636236f799b19f132abf8d70\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tickets\` ADD CONSTRAINT \`FK_a95369aeea12da7fde110e95e00\` FOREIGN KEY (\`ticket_type_id\`) REFERENCES \`ticket_types\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
