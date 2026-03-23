import { DriversService } from '../drivers/drivers.service';
import { TripsService } from '../trips/trips.service';
import { StationsService } from '../stations/stations.service';
export declare class AdminController {
    private driversService;
    private tripsService;
    private stationsService;
    constructor(driversService: DriversService, tripsService: TripsService, stationsService: StationsService);
    getAllDrivers(): Promise<any[]>;
    getAllDriversFull(): Promise<import("../drivers/driver.entity").Driver[]>;
    getAllStations(): Promise<import("../stations/station.entity").Station[]>;
    createStation(data: {
        name: string;
        centerLat: number;
        centerLng: number;
        radiusMeters?: number;
    }): Promise<import("../stations/station.entity").Station>;
    getAllTrips(): Promise<import("../trips/trip.entity").Trip[]>;
    getTodayTrips(): Promise<import("../trips/trip.entity").Trip[]>;
    getHourlyStats(): Promise<any[]>;
    createTrip(data: {
        stationId: string;
        customerName?: string;
        customerPhone?: string;
        destination?: string;
    }): Promise<import("../trips/trip.entity").Trip>;
    removeDriverFromQueue(id: string): Promise<{
        message: string;
    }>;
    deleteDriver(id: string): Promise<{
        deleted: boolean;
    }>;
    deleteTrip(id: string): Promise<{
        deleted: boolean;
    }>;
}
