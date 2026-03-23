import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DriversModule } from './drivers/drivers.module';
import { QueueModule } from './queue/queue.module';
import { StationsModule } from './stations/stations.module';
import { TripsModule } from './trips/trips.module';
import { GeofenceModule } from './geofence/geofence.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'umut',
      password: 'durak123',
      database: 'geodurak_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // DEV ONLY
    }),
    ScheduleModule.forRoot(),
    RedisModule,
    DriversModule,
    StationsModule,
    TripsModule,
    GeofenceModule,
    QueueModule,
    AdminModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}