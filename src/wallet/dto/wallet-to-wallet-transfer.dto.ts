import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
} from 'class-validator';

export class WalletToWalletTransferDto {
  @ApiProperty({
    description: "Unique identifier of the receiver's wallet",
    example: 'd2e94b1c-0c4e-4f93-8f73-11e2c56b8c5f',
  })
  @IsString()
  @IsNotEmpty()
  receiverWalletId: string;

  @ApiProperty({
    description: 'Amount to transfer',
    example: 5000,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Narration or description for the transfer',
    example: 'Payment for goods',
    required: false,
  })
  @IsString()
  @IsOptional()
  narration?: string;

  @ApiProperty({
    example: '123784',
    description: '6-digit transaction PIN for verification',
  })
  @IsString()
  @IsNotEmpty({ message: 'Transaction PIN is required' })
  transactionPin: string;
}
