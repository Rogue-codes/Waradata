// src/auth/auth.service.ts

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { Otp, OtpPurpose } from 'src/database/entities/otp.entity';
import * as dayjs from 'dayjs';
import { UserService } from './user.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { WalletService } from 'src/wallet/wallet.service';
import { Wallet } from 'src/wallet/entities/wallet.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Otp)
    private readonly otpRepo: Repository<Otp>,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly walletService: WalletService,
  ) {}

  async login(
    dto: LoginDto,
  ): Promise<{
    accessToken: string;
    user: Partial<User> & { wallet?: Wallet };
  }> {
    const { identifier, password } = dto;

    const user = await this.userRepo.findOne({
      where: [
        { email: identifier.toLowerCase() },
        { user_name: identifier.toLowerCase() },
      ],
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    if (!user.is_verified) {
      throw new BadRequestException('Please verify your email first.');
    }

    if (!user.is_active) {
      throw new BadRequestException('User account is not active.');
    }

    const payload = { id: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    const wallet = await this.walletService.findOne(user.id);

    const { password: _, transaction_pin, ...safeUser } = user;

    return {
      user: { ...safeUser, wallet },
      accessToken,
    };
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ message: string; code: string }> {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    const otpCode = this.userService.generateOtp();
    const hashedOtp = await bcrypt.hash(otpCode, 10);

    const otp = this.otpRepo.create({
      otp: hashedOtp,
      user: user,
      purpose: OtpPurpose.PASSWORD_RESET,
      expiresAt: dayjs().add(10, 'minutes').toDate(),
    });

    await this.otpRepo.save(otp);

    // await this.mailService.sendOtpEmail(user.email, otpCode); // Implementation required

    return {
      message: 'OTP sent to your email address',
      code: otpCode,
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<string> {
    const { email, otpCode, newPassword } = dto;

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const otp = await this.otpRepo.findOne({
      where: {
        user: { id: user.id },
        purpose: OtpPurpose.PASSWORD_RESET,
      },
      relations: ['user'],
    });

    if (!otp || otp.isUsed) throw new BadRequestException('Invalid OTP');
    if (dayjs().isAfter(otp.expiresAt))
      throw new BadRequestException('OTP expired');
    const validOtp = await bcrypt.compare(otpCode, otp.otp);
    if (!validOtp) throw new BadRequestException('Invalid OTP');

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);

    await this.otpRepo.remove(otp);

    return 'Password reset successful';
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<string> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isOldPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );

    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from old password',
      );
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    user.password = hashed;
    await this.userRepo.save(user);

    return 'Password changed successfully';
  }

  async getProfile(
    userId: string,
  ): Promise<Partial<User> & { wallet?: Wallet }> {
   
    return await this.userService.getLoggedInUser(userId)
  }
}
