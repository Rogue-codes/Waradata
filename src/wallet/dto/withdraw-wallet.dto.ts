import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsPositive,
  IsNotEmpty,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

class AccountDto {
  @ApiProperty({
    example: '0123456789',
    description: '10-digit account number',
  })
  @IsString()
  @Length(10, 10, { message: 'Account number must be 10 digits' })
  account_number: string;

  @ApiProperty({
    example: '011',
    description: 'Unique bank code (e.g. CBN code)',
  })
  @IsString()
  bank_code: string;
}

export class WithDrawWalletDto {
  @ApiProperty({
    example: 5000,
    description:
      'Amount to withdraw from the wallet (must be greater than zero)',
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

  @ApiProperty({
    type: () => AccountDto,
    description: 'Bank account details where the withdrawal will be processed',
  })
  @ValidateNested()
  @Type(() => AccountDto)
  account: AccountDto;
}
