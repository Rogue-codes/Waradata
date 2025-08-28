import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('referral_bonus')
export class ReferralBonus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Column()
  referee_id: string;

  @Column({ default: false })
  isClaimed: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;
}
