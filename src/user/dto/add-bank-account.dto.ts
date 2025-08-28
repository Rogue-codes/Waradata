import { Type } from 'class-transformer';
import { IsArray, IsString, Length, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class BankDto {
  @ApiProperty({
    example: 'First Bank of Nigeria',
    description: 'Name of the bank',
  })
  @IsString()
  bank_name: string;

  @ApiProperty({
    example: '011',
    description: 'Unique bank code (e.g. CBN code)',
  })
  @IsString()
  bank_code: string;
}

class AccountDto {
  @ApiProperty({
    example: '0123456789',
    description: '10-digit account number',
  })
  @IsString()
  @Length(10, 10, { message: 'Account number must be 10 digits' })
  account_number: string;

  @ApiProperty({
    type: () => BankDto,
    description: 'Bank details for the account',
  })
  @ValidateNested()
  @Type(() => BankDto)
  bank: BankDto;
}

export class AddBankAccountsDto {
  @ApiProperty({
    type: [AccountDto],
    description: 'List of bank accounts to add',
    example: [
      {
        account_number: '0123456789',
        bank: {
          bank_name: 'First Bank of Nigeria',
          bank_code: '011',
        },
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccountDto)
  accounts: AccountDto[];
}
