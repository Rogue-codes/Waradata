import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { Repository } from 'typeorm';
import { ReferralBonus } from 'src/database/entities/user.referal.bonus.entity';
import * as bcrypt from 'bcrypt';
import { Otp, OtpPurpose } from 'src/database/entities/otp.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { instanceToPlain } from 'class-transformer';
import { SendOtpEvent } from 'src/events/SendOtpEvent';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { Wallet } from 'src/wallet/entities/wallet.entity';
import { WalletService } from 'src/wallet/wallet.service';
import { DataSource } from 'typeorm';
import { RedisService } from 'src/redis/redis.service';
import { AddBankAccountsDto } from './dto/add-bank-account.dto';
import { PaymentService } from 'src/payment/payment.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ReferralBonus)
    private readonly referralBonusRepo: Repository<ReferralBonus>,
    @InjectRepository(Otp)
    private readonly otpRepo: Repository<Otp>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => WalletService))
    private walletsService: WalletService,
    private eventEmitter: EventEmitter2,
    private redisService: RedisService,
    private paymentService: PaymentService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<any> {
    const { email, phone, user_name, password, transaction_pin } =
      createUserDto;

    await this.ensureUniqueFields(email, phone, user_name);

    const hashedPassword = await this.hash(password);
    const hashedPin = await this.hash(transaction_pin);

    const otpCode = this.generateOtp();
    const referralCode = await this.generateReferralCode();

    return this.dataSource.transaction(async (manager) => {
      // Save user
      const user = manager.create(User, {
        ...createUserDto,
        password: hashedPassword,
        transaction_pin: hashedPin,
        referral_code: referralCode,
      });
      const savedUser = await manager.save(user);

      // Create wallet
      await this.walletsService.create(savedUser, manager);

      // Save OTP
      const hashedOtp = await this.hash(otpCode);

      const ttl = 10 * 60 * 1000;

      const payload: { code: string; referralCode: string; expiresIn: number } =
        {
          code: hashedOtp,
          referralCode: createUserDto.referral_code,
          expiresIn: Date.now() + ttl,
        };

      const cacheKey = `otp:${user.email}:${OtpPurpose.ACCOUNT_VERIFICATION}`;
      this.redisService.set(cacheKey, payload);

      // Emit event
      this.eventEmitter.emit(
        'user.otp.generated',
        new SendOtpEvent(savedUser, otpCode),
      );

      return instanceToPlain({ ...savedUser, otp: otpCode });
    });
  }

  async verifyOtp(payload: VerifyOtpDto): Promise<{ message: string }> {
    const { email, otpCode, purpose } = payload;

    const cacheKey = `otp:${email}:${purpose}`;

    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otp: { code: string; referralCode: string; expiresIn: number } =
      await this.redisService.get(cacheKey);

    if (!otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // validation for otp expiry
    if (Date.now() > otp.expiresIn) {
      throw new BadRequestException('OTP has expired');
    }

    const isValidOtp = await bcrypt.compare(otpCode, otp.code);

    if (!isValidOtp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Delete OTP after successful verification
    await this.redisService.delete(cacheKey);

    if (purpose === OtpPurpose.ACCOUNT_VERIFICATION) {
      user.is_verified = true;
      user.is_active = true;
      if (otp.referralCode !== null) {
        this.handleReferral(otp.referralCode, user.id);
      }
      await this.userRepo.save(user);
    }

    // send email

    return { message: 'OTP verified successfully' };
  }

  async getAllUsers({
    limit = 10,
    page = 1,
    is_active,
    search,
  }: {
    limit?: number;
    page?: number;
    is_active?: boolean;
    search?: string;
  }): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    try {
      const query = this.userRepo.createQueryBuilder('user');

      if (typeof is_active === 'boolean') {
        query.andWhere('user.is_active = :is_active', { is_active });
      }

      if (search) {
        query.andWhere(
          `(user.email ILIKE :search OR user.phone ILIKE :search OR user.user_name ILIKE :search)`,
          { search: `%${search}%` },
        );
      }

      query.orderBy('user.created_at', 'DESC');
      query.skip((page - 1) * limit).take(limit);

      const [users, total] = await query.getManyAndCount();

      // Sanitize sensitive fields
      const sanitized = users.map((user) => {
        delete user.password;
        delete user.transaction_pin;
        return user;
      });

      return {
        data: sanitized,
        total,
        page,
        limit,
      };
    } catch (error) {
      console.log('Failed to fetch users', error.stack);
      throw new InternalServerErrorException('Unable to retrieve users');
    }
  }

  async addBankAccounts(userId: string, payload: AddBankAccountsDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    // Resolve all bank accounts in parallel
    await Promise.all(
      payload.accounts.map((account) =>
        this.paymentService.resolveBankAccount(
          account.account_number,
          account.bank.bank_code,
        ),
      ),
    );

    if (!user.accounts) {
      user.accounts = [];
    }

    user.accounts.push(...payload.accounts);
    await this.userRepo.save(user);

    return user;
  }

  async getUserById(
    id: string,
  ): Promise<Omit<User, 'password' | 'transaction_pin'>> {
    const user = await this.userRepo.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Manually exclude sensitive fields
    const { password, transaction_pin, ...safeUser } = user;

    return safeUser;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    Object.assign(user, updateUserDto);

    return await this.userRepo.save(user);
  }

  async resendOtp(
    dto: ResendOtpDto,
  ): Promise<{ message: string; otp: string }> {
    const { email, purpose } = dto;

    const cacheKey = `otp:${email}:${purpose}`;

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const newOtp = this.generateOtp();

    const oldCachedData: { code: string; referralCode: string } =
      await this.redisService.get(cacheKey);

    const hashedOtp = await this.hash(newOtp);

    const ttl = 10 * 60 * 1000;
    // Save new OTP
    const payload: { code: string; referralCode: string; expiresIn: number } = {
      code: hashedOtp,
      referralCode: oldCachedData.referralCode,
      expiresIn: Date.now() + ttl,
    };

    // Remove previous unused OTPs for this user and purpose
    await this.redisService.delete(cacheKey);

    //add new otp to redis
    await this.redisService.set(cacheKey, payload);

    // Send OTP via email (you can also integrate SMS here)
    // await sendOtpEmail(user.email, newOtp, purpose);

    return { message: 'OTP resent successfully', otp: newOtp };
  }

  async getLoggedInUser(userId: string) {
    const user = await this.getUserById(userId);
    const wallet = await this.walletsService.findOne(userId);

    return {
      ...user,
      wallet,
    };
  }

  async getReferralWallet(userId: string) {
    const wallet = await this.referralBonusRepo.find({
      where: {
        user_id: userId,
        isClaimed: false,
      },
    });

    const walletBalance = wallet.reduce(
      (acc, item) => acc + Number(item.amount),
      0,
    );

    return walletBalance;
  }

  private async ensureUniqueFields(
    email: string,
    phone: string,
    username: string,
  ): Promise<void> {
    const existing = await this.userRepo.findOne({
      where: [{ email }, { phone }, { user_name: username }],
    });

    if (existing) {
      const conflictField =
        existing.email === email
          ? 'Email'
          : existing.phone === phone
            ? 'Phone'
            : 'Username';

      throw new ConflictException(`${conflictField} already exists`);
    }
  }

  private async hash(data: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(data, saltRounds);
  }

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  }

  private async generateReferralCode(): Promise<string> {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes 0,1,O,I
    const length = 8;

    let code: string;

    do {
      code = Array.from({ length }, () =>
        charset.charAt(Math.floor(Math.random() * charset.length)),
      ).join('');

      const existing = await this.userRepo.findOne({
        where: { referral_code: code },
      });
      if (!existing) break;
    } while (true);

    return code;
  }

  private async handleReferral(
    code: string,
    referee_id: string,
  ): Promise<void> {
    if (!code) return;

    const referrer = await this.userRepo.findOne({
      where: { referral_code: code },
    });

    if (!referrer) {
      throw new NotFoundException('Invalid referral code');
    }

    const referralBonus = this.referralBonusRepo.create({
      user_id: referrer.id,
      referee_id: referee_id,
      amount: 200.0,
    });

    await this.referralBonusRepo.save(referralBonus);
  }
}
