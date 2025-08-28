import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserAccountsField1755973222162 implements MigrationInterface {
    name = 'AddUserAccountsField1755973222162'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "accounts" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "accounts"`);
    }

}
