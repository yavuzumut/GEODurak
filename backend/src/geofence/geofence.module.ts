import { Module } from '@nestjs/common';
import { GeofenceService } from './geofence.service';
import { DriversModule } from '../drivers/drivers.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Driver } from '../drivers/driver.entity';
import { Station } from '../stations/station.entity';
import { GPSLocationService } from './gps-location.service';
import { MockLocationService } from './mock-location.service';
import { DevController } from './dev.controller';
import { RedisModule } from '../redis/redis.module';

const LocationServiceProvider = {
  provide: 'ILocationService',
  useFactory: (gps: GPSLocationService, mock: MockLocationService) => {
    return process.env.NODE_ENV !== 'production' && process.env.TEST_MODE === 'true' 
           ? mock 
           : gps;
  },
  inject: [GPSLocationService, MockLocationService]
};

@Module({
  imports: [DriversModule, TypeOrmModule.forFeature([Driver, Station]), RedisModule],
  controllers: [DevController],
  providers: [GeofenceService, GPSLocationService, MockLocationService, LocationServiceProvider],
  exports: [GeofenceService, LocationServiceProvider],
})
export class GeofenceModule {}