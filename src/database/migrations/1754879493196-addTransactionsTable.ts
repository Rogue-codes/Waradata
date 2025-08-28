import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTransactionsTable1754879493196 implements MigrationInterface {
    name = 'AddTransactionsTable1754879493196'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."transaction_type" AS ENUM('CREDIT', 'DEBIT')`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_category" AS ENUM('TRANSFER', 'AIRTIME', 'DATA', 'INTERNET', 'ELECTRICITY', 'CABLE', 'ACCOUNT_FUNDING', 'OTHER')`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_status" AS ENUM('PENDING', 'SUCCESS', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "wallet_id" uuid NOT NULL, "user_id" uuid NOT NULL, "type" "public"."transaction_type" NOT NULL, "category" "public"."transaction_category" NOT NULL, "amount" numeric(12,2) NOT NULL, "reference" character varying, "description" character varying, "recipient_account" character varying, "recipient_name" character varying, "service_provider" character varying, "status" "public"."transaction_status" NOT NULL DEFAULT 'PENDING', "metadata" json, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0b171330be0cb621f8d73b87a9" ON "transactions" ("wallet_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e9acc6efa76de013e8c1553ed2" ON "transactions" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_0b171330be0cb621f8d73b87a9e" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_0b171330be0cb621f8d73b87a9e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e9acc6efa76de013e8c1553ed2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0b171330be0cb621f8d73b87a9"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_status"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_category"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_type"`);
    }

}
