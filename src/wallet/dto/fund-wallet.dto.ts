import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsNotEmpty, IsString } from 'class-validator';

export class FundWalletDto {
  @ApiProperty({
    example: 5000,
    description: 'Amount to fund the wallet with (must be greater than zero)',
  })
  @IsNumber()
  @IsPositive({ message: 'Amount must be greater than zero' })
  amount: number;

  @ApiProperty({
    example: '1234',
    description: '4-digit transaction PIN for verification',
  })
  @IsString()
  @IsNotEmpty({ message: 'Transaction PIN is required' })
  transactionPin: string;
}
