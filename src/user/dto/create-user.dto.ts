import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsDateString,
  Matches,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  Length,
} from 'class-validator';

export enum Gender {
  Male = 'male',
  Female = 'female',
  Other = 'other',
}

export class CreateUserDto {
  @ApiProperty({ example: 'johndoe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '08031234567' })
  @IsNotEmpty()
  @Matches(/^\d{10,15}$/, { message: 'Phone must be 10 to 15 digits' })
  phone: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty({ example: 'Michael', required: false })
  @IsOptional()
  @IsString()
  middle_name?: string;

  @ApiProperty({
    example: 'johndoe',
    description:
      'Unique username. Must be at most 8 characters long.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8, { message: 'Username must be at most 8 characters long' })
  user_name: string;

  @ApiProperty({ example: '1995-07-21' })
  @IsDateString()
  DOB: string;

  @ApiProperty({ enum: Gender, example: Gender.Male })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: 'REF123ABC' })
  @IsString()
  @IsOptional()
  referral_code: string;

  @ApiProperty({ example: 'SecurePass@123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '123456' })
  @Length(6, 6, { message: 'Transaction PIN must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'Transaction PIN must contain only digits' })
  transaction_pin: string;
}
