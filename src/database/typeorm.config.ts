import * as dotenv from 'dotenv';
dotenv.config();

import { TypeOrmModuleOptions } from '@nestjs/typeorm';


export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env['DB_HOST'],
  port: parseInt(process.env['DB_PORT'] || '5432'),
  username: process.env['DB_USER'],
  password: process.env['DB_PASSWORD'],
  database: process.env['DB_NAME'],
  autoLoadEntities: true,
  synchronize: false, 
  ssl:{
        rejectUnauthorized: false, // or true if you're using trusted CA
      }
};
