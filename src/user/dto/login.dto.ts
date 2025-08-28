// src/auth/dto/login.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'johndoe@example.com or johndoe123' })
  @IsString()
  @IsNotEmpty()
  identifier: string; // email or username

  @ApiProperty({ example: 'StrongPassword123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
