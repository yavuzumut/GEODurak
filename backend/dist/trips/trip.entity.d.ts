export declare enum TripStatus {
    PENDING = "pending",
    ASSIGNED = "assigned",
    ACCEPTED = "accepted",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare class Trip {
    id: string;
    driverId: string;
    stationId: string;
    customerName: string;
    customerPhone: string;
    destination: string;
    status: TripStatus;
    assignedAt: Date;
    acceptedAt: Date;
    completedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
