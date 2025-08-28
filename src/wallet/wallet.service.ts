import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { PaymentService } from 'src/payment/payment.service';
import { TransactionService } from 'src/transaction/transaction.service';
import {
  TransactionCategory,
  TransactionStatus,
  TransactionType,
} from 'src/transaction/entities/transaction.entity';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { UserService } from 'src/user/user.service';
import { randomBytes } from 'crypto';
import { WithDrawWalletDto } from './dto/withdraw-wallet.dto';
import { WalletToWalletTransferDto } from './dto/wallet-to-wallet-transfer.dto';
import { DataSource } from 'typeorm';
import Decimal from 'decimal.js';

@Injectable()
export class WalletService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private paymentService: PaymentService,
    private transactionService: TransactionService,
    private readonly dataSource: DataSource,
  ) {}
  async create(user: User, manager?: EntityManager) {
    const walletRepo = manager
      ? manager.getRepository(Wallet)
      : this.walletRepo;

    const walletId = this.generateWalletId(user.user_name);

    const wallet = walletRepo.create({
      user_id: user.id,
      walletId,
    });

    await walletRepo.save(wallet);
  }

  async findOne(userId: string) {
    const wallet = await this.walletRepo.findOneBy({ user_id: userId });
    if (!wallet) {
      throw new NotFoundException(`Wallet with ID ${userId} not found`);
    }
    return wallet;
  }

  async getReferralBonusWallet(userId: string) {
    const wallet = await this.walletRepo.findOneBy({ user_id: userId });
    if (!wallet) {
      throw new NotFoundException(`Wallet with ID ${userId} not found`);
    }
    return wallet;
  }

  async fundWallet(userId: string, payload: FundWalletDto) {
    const user = await this.userService.getLoggedInUser(userId);

    const transactionRef = this.generateTransactionReference(userId);

    try {
      const transaction = await this.transactionService.create({
        amount: payload.amount,
        category: TransactionCategory.ACCOUNT_FUNDING,
        type: TransactionType.CREDIT,
        user_id: user.id,
        wallet_id: user.wallet.id,
        description: 'Account funding',
        reference: transactionRef,
      });

      const paymentUrl = await this.paymentService.InitiatePayment({
        amount: payload.amount,
        email: user.email,
        tx_ref: transactionRef,
        customer_id: userId,
      });

      return paymentUrl;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async getWalletBalance(userId: string): Promise<string> {
    try {
      const wallet = await this.walletRepo.findOne({
        where: {
          user_id: userId,
        },
      });

      return wallet.balance;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async withdraw(userId: string, payload: WithDrawWalletDto) {
    const transactionRef = this.generateTransactionReference(userId);

    const user = await this.userService.getLoggedInUser(userId);

    const wallet = await this.walletRepo.findOne({
      where: {
        user_id: userId,
      },
    });

    if (Number(wallet.balance) < payload.amount) {
      throw new BadRequestException('insufficient funds');
    }
    const account = user.accounts.find(
      (acc) => acc.account_number === payload.account.account_number,
    );
    if (!account) throw new BadRequestException('Bank account not found');

    if (!account.recipient_code) {
      //create a recipient code
      const name = `${user.first_name} ${user.last_name}`;
      const recipient_code = await this.paymentService.createTransferRecipient(
        name,
        account.account_number,
        account.bank.bank_code,
        userId,
      );
      account.recipient_code = recipient_code;
      await this.userRepo.save(user);
      try {
        const transaction = await this.transactionService.create({
          amount: payload.amount,
          category: TransactionCategory.WITHDRAWAL,
          type: TransactionType.DEBIT,
          user_id: user.id,
          wallet_id: user.wallet.id,
          description: 'Account Withdrawal',
          reference: transactionRef,
        });

        const trfData = await this.paymentService.InitiateTransfer({
          amount: payload.amount,
          tx_ref: transactionRef,
          recipient: recipient_code,
        });

        return trfData;
      } catch (error) {
        console.log(error);
        return error;
      }
    }

    try {
      const transaction = await this.transactionService.create({
        amount: payload.amount,
        category: TransactionCategory.WITHDRAWAL,
        type: TransactionType.DEBIT,
        user_id: user.id,
        wallet_id: user.wallet.id,
        description: 'Account Withdrawal',
        reference: transactionRef,
      });

      const trfData = await this.paymentService.InitiateTransfer({
        amount: payload.amount,
        tx_ref: transactionRef,
        recipient: account.recipient_code,
      });

      return trfData;
    } catch (error) {
      console.log(error);
      return error;
    }

    // const transactionRef = this.generateTransactionReference(userId);
  }

  // async walletToWalletTransfer(
  //   userId: string,
  //   payload: WalletToWalletTransferDto,
  // ) {
  //   const transactionReference = this.generateTransactionReference(userId);

  //   // get sender wallet
  //   const senderWallet = await this.walletRepo.findOne({
  //     where: { user_id: userId },
  //   });

  //   if (!senderWallet) {
  //     throw new NotFoundException('Sender wallet not found');
  //   }

  //   if (senderWallet.walletId === payload.receiverWalletId) {
  //     throw new BadRequestException('Cannot transfer to the same wallet');
  //   }

  //   if (Number(senderWallet.balance) < payload.amount) {
  //     throw new BadRequestException('Insufficient funds');
  //   }

  //   // get receiver wallet
  //   const receiverWallet = await this.walletRepo.findOne({
  //     where: { walletId: payload.receiverWalletId },
  //   });

  //   if (!receiverWallet) {
  //     throw new NotFoundException('Receiver wallet not found');
  //   }

  //   return await this.dataSource.transaction(async (manager) => {
  //     // create debit transaction (PENDING)
  //     const debitTx = await this.transactionService.create(
  //       {
  //         amount: payload.amount,
  //         category: TransactionCategory.TRANSFER,
  //         type: TransactionType.DEBIT,
  //         user_id: senderWallet.user_id,
  //         wallet_id: senderWallet.walletId,
  //         description: payload.narration,
  //         reference: transactionReference,
  //       },
  //       manager,
  //     );

  //     // update sender balance
  //     senderWallet.balance = (
  //       Number(senderWallet.balance) - payload.amount
  //     ).toString();
  //     await manager.save(senderWallet);

  //     // create credit transaction (PENDING)
  //     const creditTx = await this.transactionService.create(
  //       {
  //         amount: payload.amount,
  //         category: TransactionCategory.TRANSFER,
  //         type: TransactionType.CREDIT,
  //         user_id: receiverWallet.user_id,
  //         wallet_id: receiverWallet.walletId,
  //         description: payload.narration,
  //         reference: transactionReference,
  //       },
  //       manager,
  //     );

  //     // update receiver balance
  //     receiverWallet.balance = (
  //       Number(receiverWallet.balance) + payload.amount
  //     ).toString();
  //     await manager.save(receiverWallet);

  //     // mark both as SUCCESS after balances are updated
  //     debitTx.status = 'SUCCESS';
  //     creditTx.status = 'SUCCESS';

  //     await manager.save(debitTx);
  //     await manager.save(creditTx);

  //     return {
  //       reference: transactionReference,
  //       amount: payload.amount,
  //       narration: payload.narration,
  //       sender: {
  //         walletId: senderWallet.walletId,
  //         balance: senderWallet.balance,
  //       },
  //       receiver: {
  //         walletId: receiverWallet.walletId,
  //         balance: receiverWallet.balance,
  //       },
  //       debitTransaction: debitTx,
  //       creditTransaction: creditTx,
  //     };
  //   });
  // }

  async walletToWalletTransfer(
    userId: string,
    payload: WalletToWalletTransferDto,
  ) {
    console.log('payload', payload);
    const transactionReference = this.generateTransactionReference(userId);

    return await this.dataSource.transaction(async (manager) => {
      // Get sender wallet with row-level locking
      const senderWallet = await manager.findOne(this.walletRepo.target, {
        where: { user_id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      console.log('senderWallet', senderWallet);

      if (!senderWallet) {
        throw new NotFoundException('Sender wallet not found');
      }
      // Get receiver wallet with row-level locking
      const receiverWallet = await manager.findOne(this.walletRepo.target, {
        where: { walletId: payload.receiverWalletId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!receiverWallet) {
        throw new NotFoundException('Receiver wallet not found');
      }

      // Prevent self-transfer (additional check in case walletId matches user_id pattern)
      if (senderWallet.walletId === receiverWallet.walletId) {
        throw new BadRequestException('Cannot transfer to the same wallet');
      }

      // Use Decimal for precise calculations
      const senderBalance = new Decimal(senderWallet.balance);
      const transferAmount = new Decimal(payload.amount);
      const receiverBalance = new Decimal(receiverWallet.balance);

      // Check sufficient funds
      if (senderBalance.lessThan(transferAmount)) {
        throw new BadRequestException('Insufficient funds');
      }

      // Calculate new balances
      const newSenderBalance = senderBalance.minus(transferAmount);
      const newReceiverBalance = receiverBalance.plus(transferAmount);

      try {
        // Create debit transaction
        const debitTx = await this.transactionService.create(
          {
            amount: payload.amount,
            category: TransactionCategory.TRANSFER,
            type: TransactionType.DEBIT,
            user_id: userId,
            wallet_id: senderWallet.id,
            description:
              payload.narration || `Transfer to ${receiverWallet.walletId}`,
            reference: transactionReference,
            status: TransactionStatus.PENDING,
            recipient_account: receiverWallet.walletId,
          },
          manager,
        );

        // Create credit transaction
        const creditTx = await this.transactionService.create(
          {
            amount: payload.amount,
            category: TransactionCategory.TRANSFER,
            type: TransactionType.CREDIT,
            user_id: receiverWallet.user_id,
            wallet_id: receiverWallet.id,
            description:
              payload.narration || `Transfer from ${senderWallet.walletId}`,
            reference: transactionReference,
            status: TransactionStatus.PENDING,
          },
          manager,
        );

        // Update wallet balances
        senderWallet.balance = newSenderBalance.toString();
        receiverWallet.balance = newReceiverBalance.toString();

        await manager.save(senderWallet);
        await manager.save(receiverWallet);

        // Mark transactions as successful
        debitTx.status = TransactionStatus.SUCCESS;
        creditTx.status = TransactionStatus.SUCCESS;

        await manager.save(debitTx);
        await manager.save(creditTx);

        // Log the successful transfer
        console.log(
          `Wallet transfer completed: ${transactionReference}, Amount: ${payload.amount}, From: ${senderWallet.walletId}, To: ${receiverWallet.walletId}`,
        );

        return {
          reference: transactionReference,
          amount: payload.amount,
          narration: payload.narration,
          sender: {
            walletId: senderWallet.walletId,
            balance: senderWallet.balance,
          },
          receiver: {
            walletId: receiverWallet.walletId,
            balance: receiverWallet.balance,
          },
          debitTransaction: {
            id: debitTx.id,
            reference: debitTx.reference,
            status: debitTx.status,
          },
          creditTransaction: {
            id: creditTx.id,
            reference: creditTx.reference,
            status: creditTx.status,
          },
        };
      } catch (error) {
        // Log the error for debugging
        console.log(
          `Wallet transfer failed: ${transactionReference}`,
          error,
        );

        // Re-throw to trigger transaction rollback
        throw error;
      }
    });
  }

  private generateTransactionReference(userId: string): string {
    const timestamp = Date.now(); // milliseconds since epoch
    const randomSegment = randomBytes(4).toString('hex').toUpperCase(); // 8-char random
    return `TX-${userId}-${timestamp}-${randomSegment}`;
  }

  private generateWalletId(username: string): string {
    return `WARA-${username.toUpperCase()}`;
  }
}
