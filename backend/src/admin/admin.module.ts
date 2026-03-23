import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { DriversModule } from '../drivers/drivers.module';
import { TripsModule } from '../trips/trips.module';
import { StationsModule } from '../stations/stations.module';

@Module({
  imports: [DriversModule, TripsModule, StationsModule],
  controllers: [AdminController],
})
export class AdminModule {}
