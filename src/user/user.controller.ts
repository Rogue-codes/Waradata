import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Res,
  Query,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Request, Response } from 'express';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { AuthGuard } from 'src/guards/AuthGuard';
import { AddBankAccountsDto } from './dto/add-bank-account.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async create(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    try {
      const response = await this.userService.create(createUserDto);
      return res.status(201).json({
        success: true,
        message: 'registration successful',
        data: response,
      });
    } catch (error) {
      console.log(error);
      return res.status(error.status || 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto, @Res() res: Response) {
    try {
      const response = await this.userService.verifyOtp(verifyOtpDto);
      return res.status(200).json({
        success: true,
        message: response.message,
      });
    } catch (error) {
      console.log(error);
      return res.status(error.status || 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('add-accounts')
  async addAccounts(
    @Body() addAccountsDto: AddBankAccountsDto,
    @Res() res: Response,
    @Req() req,
  ) {
    try {
      const response = await this.userService.addBankAccounts(
        req.user.id,
        addAccountsDto,
      );
      return res.status(200).json({
        success: true,
        message: 'bank accounts added successfully',
        data: response,
      });
    } catch (error) {
      console.log(error);
      return res.status(error.status || 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  @ApiQuery({ name: 'page', required: true })
  @ApiQuery({ name: 'limit', required: true })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @Get('all')
  async findAllUsers(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
    @Query('isActive') isActive: string,
    @Res() res: Response,
  ) {
    try {
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);

      if (isNaN(pageNumber) || isNaN(limitNumber)) {
        throw new BadRequestException(
          '`page` and `limit` must be valid numbers',
        );
      }

      const isActiveBool =
        isActive !== undefined ? isActive === 'true' : undefined;

      const result = await this.userService.getAllUsers({
        page: pageNumber,
        limit: limitNumber,
        search,
        is_active: isActiveBool,
      });

      return res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: result,
      });
    } catch (error) {
      console.error(error);
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'An error occurred while fetching users',
      });
    }
  }

  @Get(':id')
  async findUserById(@Param('id') id: string, @Res() res: Response) {
    try {
      const response = await this.userService.getUserById(id);
      return res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: response,
      });
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @UseGuards(AuthGuard)
  @Patch(':id/modify')
  async updateUser(
    @Body() updateUserDto: UpdateUserDto,
    @Res() res: Response,
    @Req() req,
  ): Promise<any> {
    try {
      const updatedUser = await this.userService.updateUser(
        req.user.id,
        updateUserDto,
      );
      return res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      console.error(error);
      return res.status(error.status || 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Post('resend-otp')
  async resendOtp(@Body() dto: ResendOtpDto, @Res() res: Response) {
    try {
      const response = await this.userService.resendOtp(dto);
      return res.status(200).json({
        success: true,
        message: response.message,
        code: response.otp,
      });
    } catch (error) {
      console.log(error);
      return res.status(error.status || 500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
