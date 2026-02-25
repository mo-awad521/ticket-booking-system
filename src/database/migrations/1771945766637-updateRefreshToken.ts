import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateRefreshToken1771945766637 implements MigrationInterface {
    name = 'UpdateRefreshToken1771945766637'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`is_active\``);
        await queryRunner.query(`ALTER TABLE \`refresh_tokens\` DROP COLUMN \`revoked\``);
        await queryRunner.query(`ALTER TABLE \`refresh_tokens\` DROP COLUMN \`token\``);
        await queryRunner.query(`ALTER TABLE \`refresh_tokens\` ADD \`token_hash\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`refresh_tokens\` ADD \`ip_address\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`refresh_tokens\` ADD \`user_agent\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`refresh_tokens\` ADD \`is_revoked\` tinyint NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`refresh_tokens\` DROP COLUMN \`is_revoked\``);
        await queryRunner.query(`ALTER TABLE \`refresh_tokens\` DROP COLUMN \`user_agent\``);
        await queryRunner.query(`ALTER TABLE \`refresh_tokens\` DROP COLUMN \`ip_address\``);
        await queryRunner.query(`ALTER TABLE \`refresh_tokens\` DROP COLUMN \`token_hash\``);
        await queryRunner.query(`ALTER TABLE \`refresh_tokens\` ADD \`token\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`refresh_tokens\` ADD \`revoked\` tinyint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`is_active\` tinyint NOT NULL DEFAULT '0'`);
    }

}
