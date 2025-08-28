import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaystackWebhookDto } from './dto/create-budpay.dto';
import { PAYSTACK_WEBHOOK_SIGNATURE_KEY } from 'src/utils/constants';
import { AuthGuard } from 'src/guards/AuthGuard';
import { Response } from 'express';
import { ResolveBankDto } from './dto/resolve-bank.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async paymentWebhookHandler(
    @Body() dto: PaystackWebhookDto,
    @Headers() headers = {},
  ) {
    await this.paymentService.handleWebhook(
      dto,
      `${headers[PAYSTACK_WEBHOOK_SIGNATURE_KEY]}`,
    );
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('resolve-bank')
  async resolveBank(
    @Body() resolveBankDto: ResolveBankDto,
    @Res() res: Response,
  ) {
    try {
      const response = await this.paymentService.resolveBankAccount(
        resolveBankDto.account_number,
        resolveBankDto.bank_code,
      );
      return res.status(200).json({
        success: true,
        message: 'bank account resolved successfully',
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
  @Get('bank-list')
  async getAllBanks(@Res() res: Response) {
    try {
      const response = await this.paymentService.getAllBanks();
      return res.status(200).json({
        success: true,
        message: 'bank list retrieved successfully',
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
