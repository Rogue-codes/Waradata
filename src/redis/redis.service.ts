import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT, 10),
      username: 'default',
      password: process.env.REDIS_PASSWORD,
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });
  }

  async onModuleInit() {
    console.log('Connected to Redis');
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    console.log("redis payload",value)
    const stringifiedData = JSON.stringify(value)
    if (ttl) {
      await this.client.set(key, stringifiedData, 'EX', ttl);
    } else {
      await this.client.set(key, JSON.stringify(value));
    }
  }

  async get(key: string): Promise<any> {
    const value = await this.client.get(key)
    return JSON.parse(value);
  }

  async delete(key: string): Promise<number> {
    return this.client.del(key);
  }

  async onModuleDestroy() {
    await this.client.quit();
    console.log('Redis Client Disconnected');
  }
}
