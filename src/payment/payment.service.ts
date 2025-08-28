import { DataSource } from 'typeorm';

import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import {
  Transaction,
  TransactionStatus,
} from 'src/transaction/entities/transaction.entity';
import { BILL_CATEGORY } from 'src/utils/interface';
import { Wallet } from 'src/wallet/entities/wallet.entity';
import { Repository } from 'typeorm';
import { PaystackWebhookDto } from './dto/create-budpay.dto';
import { createHmac, timingSafeEqual } from 'crypto';
import { PAYSTACK_WEBHOOK_CRYPTO_ALGO } from 'src/utils/constants';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    private readonly dataSource: DataSource,
  ) {}
  async InitiatePayment(payload: {
    tx_ref: string;
    amount: number;
    email: string;
    customer_id: string;
  }) {
    const { amount, email, tx_ref, customer_id } = payload;
    if (!amount || !email || !tx_ref) {
      throw new BadRequestException('amount, tx_ref and email are required');
    }
    const baseURL = process.env.PAYSTACK_BASE_URL + 'transaction/initialize';

    const paystackPercentageFee = 1.5 / 100;
    const paystackCharge =
      amount > 2500
        ? amount * paystackPercentageFee + 100
        : amount * paystackPercentageFee;

    const amountPayable = amount + paystackCharge;

    try {
      const response = await axios.post(
        baseURL,
        {
          reference: tx_ref,
          amount: Number(amountPayable) * 100,
          currency: 'NGN',
          callback: 'https://myeduarc.com/',
          email: email,
          metadata: {
            phone: '08058091098',
            customer_id,
            fee: paystackCharge,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.data;
    } catch (err) {
      console.error(err);
      return err;
    }
  }

  async getBillCategories() {
    const baseURL =
      process.env.FLW_BASE_URL + '/top-bill-categories?country=NG';

    try {
      const response = await axios.get(baseURL, {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
      });

      console.log('response.data==>', response.data);

      return response.data;
    } catch (error) {
      console.error(error.code);
      console.error(error);
    }
  }

  async getBillerInfo(category: BILL_CATEGORY) {
    const baseURL =
      process.env.FLW_BASE_URL + `/bills/${category}/billers?country=NG`;

    try {
      const response = await axios.get(baseURL, {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
      });

      console.log('response.data==>', response.data);

      return response?.data?.data;
    } catch (error) {
      console.error(error.code);
      console.error(error);
    }
  }

  async getBillInfo(billerCode: string) {
    const baseURL = process.env.FLW_BASE_URL + `/billers/${billerCode}/items`;

    try {
      const response = await axios.get(baseURL, {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
      });

      console.log('response.data==>', response.data);

      return response?.data;
    } catch (error) {
      console.error(error.code);
      console.error(error);
    }
  }

  async validateCustomerInfo(itemCode: string, customerDetails: string) {
    const baseURL =
      process.env.FLW_BASE_URL +
      `/bill-items/${itemCode}/validate?customer=${customerDetails}`;

    try {
      const response = await axios.get(baseURL, {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
      });

      console.log('response.data==>', response.data);

      return response?.data;
    } catch (error) {
      console.error(error.code);
      console.error(error);
    }
  }

  async handleWebhook(
    dto: PaystackWebhookDto,
    signature: string,
  ): Promise<void> {
    // Validate signature
    if (!this.validatePaystackSignature(dto, signature)) {
      return; // Return 200 OK even for invalid signature to prevent retries
    }

    // Handle different event types
    switch (dto.event) {
      case 'charge.success':
        await this.processChargeSuccess(dto);
        break;
      case 'charge.failed':
        await this.processChargeFailed(dto);
        break;
      case 'transfer.success':
        await this.processTransferSuccess(dto);
        break;

      case 'transfer.failed':
        await this.processTransferFailed(dto);
        break;
      // Add other events as needed (e.g., 'refund.processed')
      default:
        return; // Return 200 OK for unhandled events
    }
  }

  private async processChargeSuccess(dto: PaystackWebhookDto): Promise<void> {
    const data = dto.data;

    try {
      await this.dataSource.transaction(async (manager) => {
        // fetch transaction using the reference
        const transaction = await manager.findOne(Transaction, {
          where: { reference: data.reference },
        });

        if (!transaction) {
          throw new Error(
            `Transaction with reference ${data.reference} not found`,
          );
        }

        if (transaction.status === TransactionStatus.SUCCESS) {
          return;
        }

        const userId = data.metadata.customer_id;

        // fetch wallet
        const wallet = await manager.findOne(Wallet, {
          where: { user_id: userId },
        });

        if (!wallet) {
          throw new Error(`Wallet not found for userId ${userId}`);
        }

        if (data.status === 'success') {
          // update transaction
          transaction.status = TransactionStatus.SUCCESS;

          // credit user wallet
          const amount__ = data.amount / 100; // Paystack sends in kobo
          const paystackCharge = data.metadata.fee;
          const settlementAmount = amount__ - data.metadata.fee;

          console.log('money', { amount__, paystackCharge, settlementAmount });

          wallet.balance = (
            Number(wallet.balance) + settlementAmount
          ).toString();

          // persist updates atomically
          await manager.save(transaction);
          await manager.save(wallet);

          console.log(
            `✅ Transaction ${transaction.reference} succeeded. Wallet updated for user ${wallet.user_id}. New balance: ${wallet.balance}`,
          );
        } else {
          throw new Error(
            `Transaction ${transaction.reference} failed with status ${data.status}`,
          );
        }
      });
    } catch (error) {
      console.error('Transaction failed and rolled back:', error.message);
      throw error;
    }
  }

  private async processChargeFailed(dto: PaystackWebhookDto): Promise<void> {
    const data = dto.data;

    try {
      const transaction = await this.transactionRepo.findOne({
        where: { reference: data.reference },
      });

      if (!transaction) {
        throw new Error(
          `Transaction with reference ${data.reference} not found`,
        );
      }

      transaction.status = TransactionStatus.FAILED;

      await this.transactionRepo.save(transaction);
    } catch (error) {
      throw error;
    }
  }

  private async processTransferSuccess(dto: any): Promise<void> {
    console.log('dto', dto.data);
    const data = dto.data;

    try {
      await this.dataSource.transaction(async (manager) => {
        // fetch transaction using the reference
        const transaction = await manager.findOne(Transaction, {
          where: { reference: data.reference },
        });

        if (!transaction) {
          throw new Error(
            `Transaction with reference ${data.reference} not found`,
          );
        }

        const userId = data.recipient.metadata.customer_id;

        // fetch wallet
        const wallet = await manager.findOne(Wallet, {
          where: { user_id: userId },
        });

        if (!wallet) {
          throw new Error(`Wallet not found for userId ${userId}`);
        }

        // update transaction
        transaction.status = TransactionStatus.SUCCESS;

        // credit user wallet
        const amount__ = data.amount / 100; // Paystack sends in kobo
        // const paystackCharge = data.metadata.fee;
        // const settlementAmount = amount__ - data.metadata.fee;

        wallet.balance = (Number(wallet.balance) - amount__).toString();

        // persist updates atomically
        await manager.save(transaction);
        await manager.save(wallet);

        console.log(
          `✅ Transaction ${transaction.reference} succeeded. Wallet updated for user ${wallet.user_id}. New balance: ${wallet.balance}`,
        );
      });
    } catch (error) {
      console.error('Transaction failed and rolled back:', error.message);
      throw error;
    }
    return;
  }

  private async processTransferFailed(dto: PaystackWebhookDto): Promise<void> {
    const data = dto.data;

    try {
      const transaction = await this.transactionRepo.findOne({
        where: { reference: data.reference },
      });

      if (!transaction) {
        throw new Error(
          `Transaction with reference ${data.reference} not found`,
        );
      }

      transaction.status = TransactionStatus.FAILED;

      await this.transactionRepo.save(transaction);
    } catch (error) {
      throw error;
    }
  }

  private validatePaystackSignature(
    dto: PaystackWebhookDto,
    signature: string,
  ): boolean {
    try {
      const hash = createHmac(
        PAYSTACK_WEBHOOK_CRYPTO_ALGO,
        process.env.PAYSTACK_SECRET_KEY,
      )
        .update(JSON.stringify(dto))
        .digest('hex');
      return timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
    } catch (error) {
      return false;
    }
  }

  async resolveBankAccount(account_number: string, bank_code: string) {
    const baseURL = `${process.env.PAYSTACK_BASE_URL}bank/resolve?account_number=${account_number}&bank_code=${bank_code}`;

    try {
      const response = await axios.get(baseURL, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('response.data:===>', response.data);

      if (!response.data.status) {
        throw new BadRequestException('Invalid bank account details');
      }

      return response.data.data;
    } catch (error) {
      console.error(
        'Error resolving bank account:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async getAllBanks() {
    const baseURL = `${process.env.PAYSTACK_BASE_URL}bank/?country=Nigeria`;

    try {
      const response = await axios.get(baseURL, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('response.data:===>', response.data);

      if (!response.data.status) {
        throw new BadRequestException('Invalid bank account details');
      }

      return response.data.data;
    } catch (error) {
      console.error(
        'Error resolving bank account:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async createTransferRecipient(
    name: string,
    account_number: string,
    bank_code: string,
    userId: string,
  ) {
    const baseURL = process.env.PAYSTACK_BASE_URL + 'transferrecipient';

    try {
      const response = await axios.post(
        baseURL,
        {
          type: 'nuban',
          name,
          account_number,
          bank_code,
          currency: 'NGN',
          metadata: {
            phone: '08058091098',
            customer_id: userId,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.data.recipient_code;
    } catch (err) {
      console.error('Paystack error:', err.response?.data || err.message);
      throw new Error(
        err.response?.data?.message || 'Failed to create transfer recipient',
      );
    }
  }

  async InitiateTransfer(payload: {
    tx_ref: string;
    amount: number;
    recipient: string;
  }) {
    const { amount, recipient, tx_ref } = payload;
    if (!amount || !recipient || !tx_ref) {
      throw new BadRequestException('amount, tx_ref and email are required');
    }
    const baseURL = process.env.PAYSTACK_BASE_URL + 'transfer';

    // const paystackPercentageFee = 1.5 / 100;
    // const paystackCharge =
    //   amount > 2500
    //     ? amount * paystackPercentageFee + 100
    //     : amount * paystackPercentageFee;

    // const amountPayable = amount + paystackCharge;

    try {
      const response = await axios.post(
        baseURL,
        {
          reference: tx_ref,
          amount: Number(amount) * 100,
          currency: 'NGN',
          source: 'balance',
          recipient,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.data;
    } catch (err) {
      console.error(err);
      return err;
    }
  }
}
