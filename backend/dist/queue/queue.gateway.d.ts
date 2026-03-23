import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DriversService } from '../drivers/drivers.service';
import { TripsService } from '../trips/trips.service';
import { GeofenceService } from '../geofence/geofence.service';
import { DriverStatus } from '../drivers/driver.entity';
export declare class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    private readonly driversService;
    private readonly tripsService;
    private readonly geofenceService;
    server: Server;
    constructor(driversService: DriversService, tripsService: TripsService, geofenceService: GeofenceService);
    evictDriver(driverId: string): void;
    private driverSockets;
    private socketDrivers;
    private queue;
    afterInit(): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleRegister(data: {
        driverId: string;
    }, client: Socket): Promise<void>;
    handleUpdateLocation(data: {
        driverId: string;
        latitude: number;
        longitude: number;
        stationId?: string;
    }, client: Socket): Promise<void>;
    handleJoinQueue(data: {
        driverId: string;
    }, client: Socket): Promise<void>;
    handleLeaveQueue(data: {
        driverId: string;
    }, client: Socket): Promise<void>;
    handleChangeStatus(data: {
        driverId: string;
        status: DriverStatus;
    }, client: Socket): Promise<void>;
    handleTripResponse(data: {
        tripId: string;
        driverId: string;
        accepted: boolean;
    }, client: Socket): Promise<void>;
    handleCompleteTrip(data: {
        tripId: string;
        driverId: string;
    }, client: Socket): Promise<void>;
    handleGetState(client: Socket): Promise<void>;
    handleReorderQueue(data: {
        queue: string[];
    }, client: Socket): Promise<void>;
    handleAdminRemoveFromQueue(data: {
        driverId: string;
    }, client: Socket): Promise<void>;
    handleAdminCreateTrip(data: {
        stationId: string;
        customerName?: string;
        customerPhone?: string;
        destination?: string;
    }, client: Socket): Promise<void>;
    handleManualAssign(data: {
        tripId: string;
        driverId: string;
    }, client: Socket): Promise<void>;
    handleAdminCancelTrip(data: {
        tripId: string;
    }, client: Socket): Promise<void>;
    handleAdminForceOffline(data: {
        driverId: string;
    }, client: Socket): Promise<void>;
    private removeFromQueue;
    private assignTripToNextDriver;
    private broadcastState;
}
