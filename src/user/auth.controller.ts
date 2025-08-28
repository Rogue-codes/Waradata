// src/auth/auth.controller.ts

import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from 'src/guards/AuthGuard';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    try {
      const response = await this.authService.login(dto);
      return res.status(200).json({
        success: true,
        message: 'Login successful',
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

  @Post('forgot-password')
  @ApiOperation({ summary: 'Send OTP for password reset' })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Res() res: Response) {
    try {
      const response = await this.authService.forgotPassword(dto);
      return res.status(200).json({
        success: true,
        message: response.message,
        code: response.code,
      });
    } catch (error) {
      console.log(error);
      return res.status(error.status || 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset user password via OTP' })
  async resetPassword(@Body() dto: ResetPasswordDto, @Res() res: Response) {
    try {
      const message = await this.authService.resetPassword(dto);
      return res.status(200).json({
        success: true,
        message,
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  @Post('change-password')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.id;
      const response = await this.authService.changePassword(userId, dto);
      return res.status(200).json({
        success: true,
        message: response,
      });
    } catch (error) {
      console.log(error);
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  @Post('profile')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get profile' })
  async profile(@Req() req, @Res() res: Response) {
    try {
      const response = await this.authService.getProfile(req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        user: response,
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
