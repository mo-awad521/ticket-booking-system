import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserVerificationToken1771623237871 implements MigrationInterface {
    name = 'CreateUserVerificationToken1771623237871'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`user_verification_tokens\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`token_hash\` varchar(255) NOT NULL, \`type\` enum ('email_verification', 'password_reset') NOT NULL, \`expires_at\` datetime NOT NULL, \`used_at\` datetime NULL, \`user_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`account_status\` enum ('pending_verification', 'active', 'suspended', 'banned', 'deactivated') NOT NULL DEFAULT 'pending_verification'`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`is_email_verified\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`user_verification_tokens\` ADD CONSTRAINT \`FK_0dbaa0aceff08b07a06e3a472d1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_verification_tokens\` DROP FOREIGN KEY \`FK_0dbaa0aceff08b07a06e3a472d1\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`is_email_verified\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`account_status\``);
        await queryRunner.query(`DROP TABLE \`user_verification_tokens\``);
    }

}
