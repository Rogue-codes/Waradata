import { MigrationInterface, QueryRunner } from "typeorm";

export class FirstMigration1754828476634 implements MigrationInterface {
    name = 'FirstMigration1754828476634'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."wallets_status_enum" AS ENUM('ACTIVE', 'SUSPENDED', 'CLOSED')`);
        await queryRunner.query(`CREATE TABLE "wallets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'NGN', "balance" numeric(18,2) NOT NULL DEFAULT '0', "status" "public"."wallets_status_enum" NOT NULL DEFAULT 'ACTIVE', "walletId" character varying(12) NOT NULL, "description" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8e246dfcb84930971b5300d8cad" UNIQUE ("walletId"), CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "referral_bonus" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying NOT NULL, "referee_id" character varying NOT NULL, "isClaimed" boolean NOT NULL DEFAULT false, "amount" numeric(10,2) NOT NULL, CONSTRAINT "PK_4196cc9471d2b557a771cbff6e5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "phone" character varying NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "middle_name" character varying, "user_name" character varying(8) NOT NULL, "DOB" date NOT NULL, "gender" character varying NOT NULL, "referral_code" character varying NOT NULL, "password" character varying NOT NULL, "transaction_pin" character varying NOT NULL, "is_verified" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"), CONSTRAINT "UQ_074a1f262efaca6aba16f7ed920" UNIQUE ("user_name"), CONSTRAINT "UQ_ba10055f9ef9690e77cf6445cba" UNIQUE ("referral_code"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "otps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "otp" character varying NOT NULL, "purpose" "public"."otps_purpose_enum" NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "isUsed" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_91fef5ed60605b854a2115d2410" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1eb34b74b10a82b8ebc6f4cdb0" ON "otps" ("otp") `);
        await queryRunner.query(`ALTER TABLE "otps" ADD CONSTRAINT "FK_82b0deb105275568cdcef2823eb" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "otps" DROP CONSTRAINT "FK_82b0deb105275568cdcef2823eb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1eb34b74b10a82b8ebc6f4cdb0"`);
        await queryRunner.query(`DROP TABLE "otps"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "referral_bonus"`);
        await queryRunner.query(`DROP TABLE "wallets"`);
        await queryRunner.query(`DROP TYPE "public"."wallets_status_enum"`);
    }

}
