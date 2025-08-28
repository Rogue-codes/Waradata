import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { WalletModule } from './wallet/wallet.module';
import { TransactionModule } from './transaction/transaction.module';
import { PaymentModule } from './payment/payment.module';
import { BillsModule } from './bills/bills.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    EventEmitterModule.forRoot(),
    UserModule,
    WalletModule,
    TransactionModule,
    PaymentModule,
    BillsModule,
    RedisModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
