import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { RideRequestsModule } from './ride-requests/ride-requests.module';
import { DriversModule } from './drivers/drivers.module';
import { PoolMatchingModule } from './pool-matching/pool-matching.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    RideRequestsModule,
    DriversModule,
    PoolMatchingModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      entities: [__dirname + '/database/entities/*{.ts,.js}'],
      synchronize: false,
      migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
      migrationsRun: false,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}