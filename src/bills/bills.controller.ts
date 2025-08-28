import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { Response } from 'express';
import { AuthGuard } from 'src/guards/AuthGuard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { BILL_CATEGORY } from 'src/utils/interface';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}
  @Get('categories')
  async findAll(@Res() res: Response) {
    try {
      const result = await this.billsService.findAll();
      return res.status(200).json({
        success: true,
        message: 'bill categories retrieved successfully',
        data: result,
      });
    } catch (error) {
      console.log(error);
      return res.status(error.status || 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Get(':category')
  async findBillerInfo(@Param('category') category: BILL_CATEGORY, @Res() res) {
    try {
      const result = await this.billsService.findBillerInfo(category);
      return res.status(200).json({
        success: true,
        message: 'bill category retrieved successfully',
        data: result,
      });
    } catch (error) {
      console.log(error);
      return res.status(error.status || 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Get('category/:biller_code')
  async findBillInfo(@Param('biller_code') biller_code: string, @Res() res) {
    try {
      const result = await this.billsService.findBillInfo(biller_code);
      return res.status(200).json({
        success: true,
        message: 'bill information retrieved successfully',
        data: result,
      });
    } catch (error) {
      console.log(error);
      return res.status(error.status || 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Get('validate-customer/:item_code')
  async validateCustomerInfo(
    @Param('item_code') item_code: string,
    @Query('customerDetails') customerDetails: string,
    @Res() res,
  ) {
    try {
      console.log("validating")
      const result = await this.billsService.validateCustomerInfo(
        item_code,
        customerDetails,
      );
      return res.status(200).json({
        success: true,
        message: 'bill information retrieved successfully',
        data: result,
      });
    } catch (error) {
      console.log(error);
      return res.status(error.status || 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBillDto: UpdateBillDto) {
    return this.billsService.update(+id, updateBillDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.billsService.remove(+id);
  }
}
