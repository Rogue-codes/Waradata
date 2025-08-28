import {
  IsNotEmpty,
  IsString,
  Length,
  IsEnum,
  IsOptional,
  IsNumberString,
} from 'class-validator';

export class CreateWalletDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsOptional()
  @IsNumberString()
  initialBalance?: string; // e.g. "1000.50"
}
