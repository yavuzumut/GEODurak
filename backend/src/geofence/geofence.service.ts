import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { DriversService } from '../drivers/drivers.service';

import { DriverStatus } from '../drivers/driver.entity';

@Injectable()
export class GeofenceService {
  private readonly logger = new Logger(GeofenceService.name);
  // 2 minutes tolerance
  private readonly GEOFENCE_TIMEOUT_MS = 2 * 60 * 1000;

  // Callbacks set by QueueGateway
  onDriverRemoved: (driverId: string) => void = () => {};

  constructor(private readonly driversService: DriversService) {}

  @Interval(15000) // Check every 15 seconds
  async checkGeofenceViolations() {
    const violators = await this.driversService.getDriversOutsideGeofenceTooLong(this.GEOFENCE_TIMEOUT_MS);

    for (const driver of violators) {
      this.logger.warn(`Driver ${driver.name} (${driver.id}) exceeded geofence timeout. Removing from queue.`);
      
      // Notify QueueGateway to remove from queue
      this.onDriverRemoved(driver.id);
      
      // Set status to offline and clear exit timer so it doesn't trigger repeatedly
      await this.driversService.updateStatus(driver.id, DriverStatus.OFFLINE);
      await this.driversService.clearGeofenceExitTimer(driver.id);
    }
  }
}
