import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TransactionPinGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authUser: { id: string; email: string } = request.user;
    const { transactionPin } = request.body;

    if (!transactionPin) {
      throw new UnauthorizedException('Transaction PIN is required');
    }

    const user = await this.userRepo.findOneBy({ id: authUser.id });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPinValid = await bcrypt.compare(
      transactionPin,
      user.transaction_pin,
    );

    if (!isPinValid) {
      throw new UnauthorizedException('Invalid transaction PIN');
    }

    return true;
  }
}
