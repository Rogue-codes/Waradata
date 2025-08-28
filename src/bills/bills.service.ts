import { Injectable } from '@nestjs/common';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { PaymentService } from 'src/payment/payment.service';
import { BILL_CATEGORY } from 'src/utils/interface';

@Injectable()
export class BillsService {
  constructor(private readonly budpayService: PaymentService) {}
  async findAll() {
    try {
      const bills = await this.budpayService.getBillCategories();
      return bills;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async findBillerInfo(category: BILL_CATEGORY) {
    try {
      const bill = await this.budpayService.getBillerInfo(category);
      return bill;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async findBillInfo(billerCode: string) {
    try {
      const bill = await this.budpayService.getBillInfo(billerCode);
      return bill;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async validateCustomerInfo(itemCode: string, customerDetails: string) {
    try {
      const validCustomer = await this.budpayService.validateCustomerInfo(
        itemCode,
        customerDetails,
      );
      return validCustomer;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  update(id: number, updateBillDto: UpdateBillDto) {
    return `This action updates a #${id} bill`;
  }

  remove(id: number) {
    return `This action removes a #${id} bill`;
  }
}
