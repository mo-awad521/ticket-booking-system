import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEventsAndTicketTypesTables1772547571028 implements MigrationInterface {
    name = 'CreateEventsAndTicketTypesTables1772547571028'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`ticket_types\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`name\` varchar(100) NOT NULL, \`price\` decimal(10,2) NOT NULL, \`quantity\` int UNSIGNED NOT NULL, \`sold_quantity\` int UNSIGNED NOT NULL DEFAULT '0', \`reserved_quantity\` int UNSIGNED NOT NULL DEFAULT '0', \`sale_start\` timestamp NULL, \`sale_end\` timestamp NULL, \`event_id\` varchar(255) NOT NULL, INDEX \`IDX_50ec4cf7acfab01ce9c6cf9b48\` (\`event_id\`, \`sale_end\`), INDEX \`IDX_e3740a284eb6c6606b07d7c684\` (\`event_id\`, \`sale_start\`), INDEX \`IDX_7ca6c99484cff1ed8ed2aee725\` (\`event_id\`, \`price\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`events\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`title\` varchar(150) NOT NULL, \`description\` text NULL, \`location\` varchar(150) NOT NULL, \`image_url\` varchar(255) NULL, \`image_public_id\` varchar(255) NULL, \`slug\` varchar(255) NOT NULL, \`start_date\` timestamp NOT NULL, \`end_date\` timestamp NOT NULL, \`status\` enum ('draft', 'published', 'cancelled', 'finished') NOT NULL DEFAULT 'draft', \`published_at\` timestamp NULL, \`organizer_id\` varchar(255) NOT NULL, \`deleted_at\` datetime(6) NULL, INDEX \`IDX_bab6cf3a1e33e6790e9b9bd7d1\` (\`title\`), INDEX \`IDX_df5d3d29b591928cede5717aba\` (\`location\`), UNIQUE INDEX \`IDX_05bd884c03d3f424e2204bd14c\` (\`slug\`), INDEX \`IDX_03dcebc1ab44daa177ae9479c4\` (\`status\`), INDEX \`IDX_22b517b56b453ab99a8fa1771d\` (\`organizer_id\`, \`created_at\`), INDEX \`IDX_000b23a3389237302df9250be5\` (\`status\`, \`start_date\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`ticket_types\` ADD CONSTRAINT \`FK_9dfa62b35548ea1e0b7e4675b20\` FOREIGN KEY (\`event_id\`) REFERENCES \`events\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`events\` ADD CONSTRAINT \`FK_14c9ce53a2c2a1c781b8390123e\` FOREIGN KEY (\`organizer_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`events\` DROP FOREIGN KEY \`FK_14c9ce53a2c2a1c781b8390123e\``);
        await queryRunner.query(`ALTER TABLE \`ticket_types\` DROP FOREIGN KEY \`FK_9dfa62b35548ea1e0b7e4675b20\``);
        await queryRunner.query(`DROP INDEX \`IDX_000b23a3389237302df9250be5\` ON \`events\``);
        await queryRunner.query(`DROP INDEX \`IDX_22b517b56b453ab99a8fa1771d\` ON \`events\``);
        await queryRunner.query(`DROP INDEX \`IDX_03dcebc1ab44daa177ae9479c4\` ON \`events\``);
        await queryRunner.query(`DROP INDEX \`IDX_05bd884c03d3f424e2204bd14c\` ON \`events\``);
        await queryRunner.query(`DROP INDEX \`IDX_df5d3d29b591928cede5717aba\` ON \`events\``);
        await queryRunner.query(`DROP INDEX \`IDX_bab6cf3a1e33e6790e9b9bd7d1\` ON \`events\``);
        await queryRunner.query(`DROP TABLE \`events\``);
        await queryRunner.query(`DROP INDEX \`IDX_7ca6c99484cff1ed8ed2aee725\` ON \`ticket_types\``);
        await queryRunner.query(`DROP INDEX \`IDX_e3740a284eb6c6606b07d7c684\` ON \`ticket_types\``);
        await queryRunner.query(`DROP INDEX \`IDX_50ec4cf7acfab01ce9c6cf9b48\` ON \`ticket_types\``);
        await queryRunner.query(`DROP TABLE \`ticket_types\``);
    }

}
