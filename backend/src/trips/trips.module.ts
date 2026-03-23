import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from './trip.entity';
import { TripsService } from './trips.service';
import { DriversModule } from '../drivers/drivers.module';

@Module({
  imports: [TypeOrmModule.forFeature([Trip]), DriversModule],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
