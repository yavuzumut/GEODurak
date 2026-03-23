export declare enum DriverStatus {
    AVAILABLE = "available",
    BUSY = "busy",
    OFFLINE = "offline"
}
export declare class Driver {
    id: string;
    name: string;
    licensePlate: string;
    phone: string;
    location: any;
    isInsideGeofence: boolean;
    status: DriverStatus;
    joinedQueueAt: Date;
    lastGeofenceExitAt: Date;
    stationId: string;
    createdAt: Date;
    updatedAt: Date;
}
