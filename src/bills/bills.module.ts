import { Module } from '@nestjs/common';
import { BillsService } from './bills.service';
import { BillsController } from './bills.controller';
import { PaymentModule } from 'src/payment/payment.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    PaymentModule,
  ],
  controllers: [BillsController],
  providers: [BillsService],
})
export class BillsModule {}
