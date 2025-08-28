import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ResolveBankDto {
  @ApiProperty({
    description: 'The code of the bank (e.g. 044 for Access Bank)',
    example: '044',
  })
  @IsString()
  bank_code: string;

  @ApiProperty({
    description: 'The 10-digit account number to resolve',
    example: '0123456789',
    minLength: 10,
    maxLength: 10,
  })
  @IsString()
  @Length(10, 10, { message: 'Account number must be 10 digits' })
  account_number: string;
}
