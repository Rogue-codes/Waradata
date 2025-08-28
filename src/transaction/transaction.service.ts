import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
import { Wallet } from 'src/wallet/entities/wallet.entity';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
  ) {}

  // async create(createTransactionDto: CreateTransactionDto) {
  //   // user
  //   const user = await this.userRepo.findOne({
  //     where: {
  //       id: createTransactionDto.user_id,
  //     },
  //   });

  //   if (!user) {
  //     throw new NotFoundException(
  //       `User with ID ${createTransactionDto.user_id} not found`,
  //     );
  //   }
  //   // wallet
  //   const wallet = await this.walletRepo.findOne({
  //     where: {
  //       id: createTransactionDto.wallet_id,
  //     },
  //   });

  //   if (!wallet) {
  //     throw new NotFoundException(
  //       `Wallet with ID ${createTransactionDto.wallet_id} not found`,
  //     );
  //   }

  //   // 3. Create transaction entity
  //   const transaction = this.transactionRepo.create({
  //     ...createTransactionDto,
  //     amount: createTransactionDto.amount.toString(), // fix decimal type
  //     wallet,
  //     user,
  //   });

  //   // 4. Save transaction
  //   return await this.transactionRepo.save(transaction);
  // }

  async create(
    createTransactionDto: CreateTransactionDto,
    manager?: EntityManager,
  ) {
    // pick repo: either manager (inside transaction) or default injected repo
    const userRepo = manager ? manager.getRepository(User) : this.userRepo;
    const walletRepo = manager
      ? manager.getRepository(Wallet)
      : this.walletRepo;
    const transactionRepo = manager
      ? manager.getRepository(Transaction)
      : this.transactionRepo;

    // 1. Validate user
    const user = await userRepo.findOne({
      where: { id: createTransactionDto.user_id },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${createTransactionDto.user_id} not found`,
      );
    }

    // 2. Validate wallet
    const wallet = await walletRepo.findOne({
      where: { id: createTransactionDto.wallet_id },
    });

    if (!wallet) {
      throw new NotFoundException(
        `Wallet with ID ${createTransactionDto.wallet_id} not found`,
      );
    }

    // 3. Create transaction entity
    const transaction = transactionRepo.create({
      ...createTransactionDto,
      amount: createTransactionDto.amount.toString(), // ensure string for decimal
      wallet,
      user,
    });

    // 4. Save transaction
    return await transactionRepo.save(transaction);
  }

  findAll() {
    return `This action returns all transaction`;
  }

  findOne(id: number) {
    return `This action returns a #${id} transaction`;
  }

  update(id: number, updateTransactionDto: UpdateTransactionDto) {
    return `This action updates a #${id} transaction`;
  }

  remove(id: number) {
    return `This action removes a #${id} transaction`;
  }
}
