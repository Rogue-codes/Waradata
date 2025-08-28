// src/user/dto/update-user.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto, Gender } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: 'john.updated@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: '08031234567' })
  phone?: string;

  @ApiPropertyOptional({ example: 'John' })
  first_name?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  last_name?: string;

  @ApiPropertyOptional({ example: 'Michael' })
  middle_name?: string;

  @ApiPropertyOptional({ example: 'johnnydoe' })
  user_name?: string;

  @ApiPropertyOptional({
    example: '1995-07-21',
    type: 'string',
    format: 'date',
  })
  DOB?: string;

  @ApiPropertyOptional({ example: 'male' })
  gender?: Gender;

  @ApiPropertyOptional({ example: 'ABC123' })
  referral_code?: string;

  @ApiPropertyOptional({ example: 'hashed_password' })
  password?: string;

  @ApiPropertyOptional({ example: '123456' })
  transaction_pin?: string;
}
