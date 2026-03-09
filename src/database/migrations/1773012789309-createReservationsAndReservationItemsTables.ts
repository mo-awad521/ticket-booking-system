import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateReservationsAndReservationItemsTables1773012789309 implements MigrationInterface {
    name = 'CreateReservationsAndReservationItemsTables1773012789309'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`reservations\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` varchar(255) NOT NULL, \`status\` enum ('active', 'expired', 'completed', 'cancelled') NOT NULL DEFAULT 'active', \`expires_at\` timestamp NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`reservation_items\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`reservation_id\` varchar(255) NOT NULL, \`ticket_type_id\` varchar(255) NOT NULL, \`quantity\` int NOT NULL, INDEX \`IDX_77fd31f8972b8cd9165c47443e\` (\`reservation_id\`), INDEX \`IDX_0339f01f087da4672244ce7f4b\` (\`ticket_type_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`reservations\` ADD CONSTRAINT \`FK_4af5055a871c46d011345a255a6\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`reservation_items\` ADD CONSTRAINT \`FK_77fd31f8972b8cd9165c47443e7\` FOREIGN KEY (\`reservation_id\`) REFERENCES \`reservations\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`reservation_items\` ADD CONSTRAINT \`FK_0339f01f087da4672244ce7f4be\` FOREIGN KEY (\`ticket_type_id\`) REFERENCES \`ticket_types\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`reservation_items\` DROP FOREIGN KEY \`FK_0339f01f087da4672244ce7f4be\``);
        await queryRunner.query(`ALTER TABLE \`reservation_items\` DROP FOREIGN KEY \`FK_77fd31f8972b8cd9165c47443e7\``);
        await queryRunner.query(`ALTER TABLE \`reservations\` DROP FOREIGN KEY \`FK_4af5055a871c46d011345a255a6\``);
        await queryRunner.query(`DROP INDEX \`IDX_0339f01f087da4672244ce7f4b\` ON \`reservation_items\``);
        await queryRunner.query(`DROP INDEX \`IDX_77fd31f8972b8cd9165c47443e\` ON \`reservation_items\``);
        await queryRunner.query(`DROP TABLE \`reservation_items\``);
        await queryRunner.query(`DROP TABLE \`reservations\``);
    }

}
