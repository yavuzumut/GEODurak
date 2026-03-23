export interface Coordinates {
    latitude: number;
    longitude: number;
}
export interface ILocationService {
    getLocation(driverId: string): Promise<Coordinates | null>;
    validateGeofence(driverId: string, stationId: string): Promise<boolean>;
}
