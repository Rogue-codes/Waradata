import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { Wallet } from 'src/wallet/entities/wallet.entity';
import { Transaction } from './entities/transaction.entity';

@Module({
  imports:[TypeOrmModule.forFeature([User, Wallet, Transaction])],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}
