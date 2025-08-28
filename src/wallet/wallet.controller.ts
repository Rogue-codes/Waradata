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
import { Request, Response } from 'express';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/AuthGuard';
import { WalletService } from './wallet.service';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { TransactionPinGuard } from 'src/guards/TransactionPinGuard';
import { UserService } from 'src/user/user.service';
import { WithDrawWalletDto } from './dto/withdraw-wallet.dto';
import { WalletToWalletTransferDto } from './dto/wallet-to-wallet-transfer.dto';

@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly userService: UserService,
  ) {}
  @ApiBearerAuth()
  @UseGuards(AuthGuard, TransactionPinGuard)
  @Post('fund')
  async create(
    @Body() fundWalletDto: FundWalletDto,
    @Req() req,
    @Res() res: Response,
  ) {
    try {
      const response = await this.walletService.fundWallet(
        req.user.id,
        fundWalletDto,
      );
      return res.status(201).json({
        success: true,
        message: 'Payment link generated successfully',
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

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get('referral-wallet/balance')
  async findUserReferralWalletById(@Req() req, @Res() res: Response) {
    try {
      const response = await this.userService.getReferralWallet(req.user.id);
      return res.status(200).json({
        success: true,
        message: 'referral wallet balance retrieved successfully',
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
  @ApiBearerAuth()
  @Get('balance')
  async getWalletBalance(@Req() req, @Res() res: Response) {
    try {
      const response = await this.walletService.getWalletBalance(req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Wallet balance retrieved successfully',
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

  @ApiBearerAuth()
  @UseGuards(AuthGuard, TransactionPinGuard)
  @Post('withdraw')
  async withdraw(
    @Body() withdrawWalletDto: WithDrawWalletDto,
    @Req() req,
    @Res() res: Response,
  ) {
    try {
      const response = await this.walletService.withdraw(
        req.user.id,
        withdrawWalletDto,
      );
      return res.status(201).json({
        success: true,
        message: 'withdraw successful',
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

  @ApiBearerAuth()
  @UseGuards(AuthGuard, TransactionPinGuard)
  @Post('wallet-to-wallet-transfer')
  async walletToWalletTransfer(
    @Body() walletToWalletTransferDto: WalletToWalletTransferDto,
    @Req() req,
    @Res() res: Response,
  ) {
    try {
      const response = await this.walletService.walletToWalletTransfer(
        req.user.id,
        walletToWalletTransferDto,
      );
      return res.status(201).json({
        success: true,
        message: 'transfer successful',
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
}
