import { User } from 'src/database/entities/user.entity';

export class SendOtpEvent {
  constructor(
    public readonly user: User,
    public readonly otp: string,
  ) {}
}
