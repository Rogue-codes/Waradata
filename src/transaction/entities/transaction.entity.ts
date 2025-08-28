import { User } from 'src/database/entities/user.entity';
import { Wallet } from 'src/wallet/entities/wallet.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';

export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export enum TransactionCategory {
  TRANSFER = 'TRANSFER',
  WITHDRAWAL = 'WITHDRAWAL',
  AIRTIME = 'AIRTIME',
  DATA = 'DATA',
  INTERNET = 'INTERNET',
  ELECTRICITY = 'ELECTRICITY',
  CABLE = 'CABLE',
  ACCOUNT_FUNDING = 'ACCOUNT_FUNDING',
  OTHER = 'OTHER',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  wallet_id: string;

  @ManyToOne(() => Wallet)
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  @Index()
  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: TransactionType, enumName: 'transaction_type' })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionCategory,
    enumName: 'transaction_category',
  })
  category: TransactionCategory;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: string; // use string here, parse when reading

  @Column({ nullable: true })
  reference: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  recipient_account: string;

  @Column({ nullable: true })
  recipient_name: string;

  @Column({ nullable: true })
  service_provider: string;

  // @Column({ nullable: true })
  // credit_account: string;

  // @Column({ nullable: true })
  // debit_account: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    enumName: 'transaction_status',
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
