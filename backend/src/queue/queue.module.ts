import { Module } from '@nestjs/common';
import { QueueGateway } from './queue.gateway';
import { DriversModule } from '../drivers/drivers.module';
import { TripsModule } from '../trips/trips.module';
import { GeofenceModule } from '../geofence/geofence.module';

@Module({
  imports: [DriversModule, TripsModule, GeofenceModule],
  providers: [QueueGateway],
})
export class QueueModule {}
