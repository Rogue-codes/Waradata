import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  TransactionType,
  TransactionCategory,
  TransactionStatus,
} from '../entities/transaction.entity';

export class CreateTransactionDto {
  @IsUUID()
  @IsNotEmpty()
  wallet_id: string;

  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsEnum(TransactionType)
  @IsNotEmpty()
  type: TransactionType;

  @IsEnum(TransactionCategory)
  @IsNotEmpty()
  category: TransactionCategory;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  amount: number;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  recipient_account?: string;

  @IsOptional()
  @IsString()
  recipient_name?: string;

  @IsOptional()
  @IsString()
  service_provider?: string;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  metadata?: Record<string, any>;
}
