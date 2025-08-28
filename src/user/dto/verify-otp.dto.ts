// src/user/dto/verify-otp.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { OtpPurpose } from 'src/database/entities/otp.entity';

export class VerifyOtpDto {
  @ApiProperty({ example: 'johnDoe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '0923' })
  @IsString()
  @IsNotEmpty()
  otpCode: string;

  @ApiProperty({
    example: OtpPurpose.ACCOUNT_VERIFICATION,
    enum: OtpPurpose,
    description: 'The purpose of the OTP',
  })
  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;
}
