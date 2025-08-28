import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserEntity1756287176164 implements MigrationInterface {
    name = 'UpdateUserEntity1756287176164'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."transaction_category" RENAME TO "transaction_category_old"`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_category" AS ENUM('TRANSFER', 'WITHDRAWAL', 'AIRTIME', 'DATA', 'INTERNET', 'ELECTRICITY', 'CABLE', 'ACCOUNT_FUNDING', 'OTHER')`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "category" TYPE "public"."transaction_category" USING "category"::"text"::"public"."transaction_category"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_category_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."transaction_category_old" AS ENUM('TRANSFER', 'AIRTIME', 'DATA', 'INTERNET', 'ELECTRICITY', 'CABLE', 'ACCOUNT_FUNDING', 'OTHER')`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "category" TYPE "public"."transaction_category_old" USING "category"::"text"::"public"."transaction_category_old"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_category"`);
        await queryRunner.query(`ALTER TYPE "public"."transaction_category_old" RENAME TO "transaction_category"`);
    }

}
