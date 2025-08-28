import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReferralBonus } from './user.referal.bonus.entity';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  phone: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ nullable: true })
  middle_name: string;

  @Column({ unique: true, length: 8 })
  user_name: string;

  @Column({ type: 'date' })
  DOB: string;

  @Column()
  gender: string;

  @Column({ unique: true })
  referral_code: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  @Exclude()
  transaction_pin: string;

  @Column({ default: false })
  is_verified: boolean;

  @Column({ default: false })
  is_active: boolean;

  @Column({ type: 'jsonb', nullable: true })
  accounts: {
    account_number: string;
    bank: {
      bank_name: string;
      bank_code: string;
    };
    recipient_code?: string;
  }[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
