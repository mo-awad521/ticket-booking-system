import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrdersAndOrdersItemsTables1773102287170 implements MigrationInterface {
    name = 'CreateOrdersAndOrdersItemsTables1773102287170'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`order_items\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`order_id\` varchar(255) NOT NULL, \`ticket_type_id\` varchar(255) NOT NULL, \`quantity\` int NOT NULL, \`unit_price\` decimal(10,2) NOT NULL, INDEX \`IDX_145532db85752b29c57d2b7b1f\` (\`order_id\`), INDEX \`IDX_41292b9bdd561fb442a064705d\` (\`ticket_type_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`orders\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` varchar(255) NOT NULL, \`status\` enum ('pending', 'paid', 'cancelled', 'expired') NOT NULL DEFAULT 'pending', \`total_amount\` decimal(10,2) NOT NULL DEFAULT '0.00', \`currency\` varchar(3) NOT NULL DEFAULT 'USD', \`expires_at\` timestamp NOT NULL, INDEX \`IDX_a922b820eeef29ac1c6800e826\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`order_items\` ADD CONSTRAINT \`FK_145532db85752b29c57d2b7b1f1\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`order_items\` ADD CONSTRAINT \`FK_41292b9bdd561fb442a064705d7\` FOREIGN KEY (\`ticket_type_id\`) REFERENCES \`ticket_types\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`orders\` ADD CONSTRAINT \`FK_a922b820eeef29ac1c6800e826a\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_a922b820eeef29ac1c6800e826a\``);
        await queryRunner.query(`ALTER TABLE \`order_items\` DROP FOREIGN KEY \`FK_41292b9bdd561fb442a064705d7\``);
        await queryRunner.query(`ALTER TABLE \`order_items\` DROP FOREIGN KEY \`FK_145532db85752b29c57d2b7b1f1\``);
        await queryRunner.query(`DROP INDEX \`IDX_a922b820eeef29ac1c6800e826\` ON \`orders\``);
        await queryRunner.query(`DROP TABLE \`orders\``);
        await queryRunner.query(`DROP INDEX \`IDX_41292b9bdd561fb442a064705d\` ON \`order_items\``);
        await queryRunner.query(`DROP INDEX \`IDX_145532db85752b29c57d2b7b1f\` ON \`order_items\``);
        await queryRunner.query(`DROP TABLE \`order_items\``);
    }

}
