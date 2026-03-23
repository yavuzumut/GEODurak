import { DriversService } from '../drivers/drivers.service';
export declare class GeofenceService {
    private readonly driversService;
    private readonly logger;
    private readonly GEOFENCE_TIMEOUT_MS;
    onDriverRemoved: (driverId: string) => void;
    constructor(driversService: DriversService);
    checkGeofenceViolations(): Promise<void>;
}
