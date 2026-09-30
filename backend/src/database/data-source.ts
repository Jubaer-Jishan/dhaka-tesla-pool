import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { DataSource } from 'typeorm';

if (existsSync('.env')) {
  process.loadEnvFile();
}

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + '/entities/*{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});