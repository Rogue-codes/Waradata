import {
  IsString,
  IsNumber,
  IsOptional,
  IsObject,
  IsInt,
  IsDateString,
} from 'class-validator';

export class BudpayCustomerDto {
  @IsInt()
  id: number;

  @IsOptional()
  @IsString()
  first_name?: string | null;

  @IsOptional()
  @IsString()
  last_name?: string | null;

  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsString()
  domain: string;

  @IsString()
  customer_code: string;

  @IsOptional()
  @IsString()
  metadata?: string;

  @IsString()
  status: string;
}

export class BudpayDataDto {
  @IsInt()
  id: number;

  @IsString()
  currency: string;

  @IsString()
  amount: string;

  @IsString()
  reference: string;

  @IsOptional()
  @IsString()
  ip_address?: string | null;

  @IsString()
  channel: string;

  @IsString()
  type: string;

  @IsString()
  domain: string;

  @IsString()
  fees: string;

  @IsOptional()
  @IsString()
  plan?: string | null;

  @IsString()
  requested_amount: string;

  @IsString()
  status: string;

  @IsInt()
  card_attempt: number;

  @IsOptional()
  @IsString()
  settlement_batchid?: string | null;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  metadata?: string;

  @IsDateString()
  created_at: string;

  @IsDateString()
  updated_at: string;

  @IsString()
  paid_at: string;

  @IsObject()
  customer: BudpayCustomerDto;
}

export type Data = {
  id?: number;
  domain?: string;
  status?: string;
  reference?: string;
  amount?: number;

  gateway_response?: string;
  paid_at?: string;
  created_at?: string;
  channel?: string;
  currency?: string;
  ip_address?: string;
  metadata?: any;

  message?: any;
  fees: any;
  log: any;
  customer: any;
  authorization: any;
  plan: any;
};

export type PaystackWebhookDto = {
  event: string;
  data: Data;
};
