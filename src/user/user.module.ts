import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { ReferralBonus } from 'src/database/entities/user.referal.bonus.entity';
import { Otp } from 'src/database/entities/otp.entity';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import * as dotenv from 'dotenv';
import { AuthController } from './auth.controller';
import { WalletModule } from 'src/wallet/wallet.module';
import { RedisModule } from 'src/redis/redis.module';
import { PaymentModule } from 'src/payment/payment.module';

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ReferralBonus, Otp]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    forwardRef(() => WalletModule),
    RedisModule,
    PaymentModule
  ],
  controllers: [UserController,AuthController],
  providers: [UserService, AuthService],
  exports: [UserService],
})
export class UserModule {}
