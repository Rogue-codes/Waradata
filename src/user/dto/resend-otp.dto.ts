// src/user/dto/resend-otp.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum } from 'class-validator';
import { OtpPurpose } from 'src/database/entities/otp.entity';

export class ResendOtpDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: OtpPurpose, example: OtpPurpose.ACCOUNT_VERIFICATION })
  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;
}
