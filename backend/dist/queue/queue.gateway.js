"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const drivers_service_1 = require("../drivers/drivers.service");
const trips_service_1 = require("../trips/trips.service");
const geofence_service_1 = require("../geofence/geofence.service");
const driver_entity_1 = require("../drivers/driver.entity");
const trip_entity_1 = require("../trips/trip.entity");
const TRIP_ACCEPT_TIMEOUT = 30000;
let QueueGateway = class QueueGateway {
    driversService;
    tripsService;
    geofenceService;
    server;
    constructor(driversService, tripsService, geofenceService) {
        this.driversService = driversService;
        this.tripsService = tripsService;
        this.geofenceService = geofenceService;
    }
    evictDriver(driverId) {
        this.removeFromQueue(driverId);
        const socketId = this.driverSockets.get(driverId);
        if (socketId) {
            this.server.to(socketId).emit('geofenceWarning', {
                message: 'Geofence süre aşımı! Sıradan otomatik olarak düşürüldünüz.',
                type: 'removed',
            });
        }
        this.broadcastState();
        console.log(`Driver ${driverId} has been evicted due to geofence timeout.`);
    }
    driverSockets = new Map();
    socketDrivers = new Map();
    queue = [];
    afterInit() {
        this.geofenceService.onDriverRemoved = (driverId) => {
            this.removeFromQueue(driverId);
            const socketId = this.driverSockets.get(driverId);
            if (socketId) {
                this.server.to(socketId).emit('geofenceWarning', {
                    message: 'Geofence süre aşımı! Sıradan düşürüldünüz.',
                    type: 'removed',
                });
            }
            this.broadcastState();
        };
    }
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        const driverId = this.socketDrivers.get(client.id);
        if (driverId) {
            this.driverSockets.delete(driverId);
            this.socketDrivers.delete(client.id);
        }
        console.log(`Client disconnected: ${client.id}`);
    }
    async handleRegister(data, client) {
        this.driverSockets.set(data.driverId, client.id);
        this.socketDrivers.set(client.id, data.driverId);
        client.emit('registered', { success: true });
        this.broadcastState();
    }
    async handleUpdateLocation(data, client) {
        try {
            const driver = await this.driversService.updateLocation(data.driverId, data.latitude, data.longitude, data.stationId);
            if (driver) {
                if (!driver.isInsideGeofence && this.queue.includes(driver.id)) {
                    client.emit('geofenceWarning', {
                        message: 'Durak sınırından çıkıyorsunuz! 2 dakika içinde geri dönün.',
                        type: 'warning',
                    });
                }
                client.emit('locationUpdated', {
                    isInsideGeofence: driver.isInsideGeofence,
                    status: driver.status,
                });
            }
            else {
                client.emit('error', { message: 'Driver not found' });
            }
            this.broadcastState();
        }
        catch (e) {
            console.error(e);
            client.emit('error', { message: 'Could not update location.' });
        }
    }
    async handleJoinQueue(data, client) {
        try {
            const driver = await this.driversService.findOne(data.driverId);
            if (driver && driver.isInsideGeofence && driver.status === driver_entity_1.DriverStatus.AVAILABLE) {
                if (!this.queue.includes(driver.id)) {
                    this.queue.push(driver.id);
                    await this.driversService.updateStatus(driver.id, driver_entity_1.DriverStatus.AVAILABLE);
                }
                client.emit('joinedQueue', {
                    position: this.queue.indexOf(driver.id) + 1,
                    total: this.queue.length,
                });
                this.broadcastState();
            }
            else {
                const reason = !driver ? 'Sürücü bulunamadı' :
                    !driver.isInsideGeofence ? 'Durak sınırı dışındasınız' :
                        'Durumunuz müsait değil';
                client.emit('error', { message: `Sıraya girilemedi: ${reason}` });
            }
        }
        catch (e) {
            console.error(e);
            client.emit('error', { message: 'Sıraya girerken hata oluştu.' });
        }
    }
    async handleLeaveQueue(data, client) {
        this.removeFromQueue(data.driverId);
        client.emit('leftQueue', { message: 'Sıradan ayrıldınız.' });
        this.broadcastState();
    }
    async handleChangeStatus(data, client) {
        const driver = await this.driversService.updateStatus(data.driverId, data.status);
        if (driver) {
            if (data.status === driver_entity_1.DriverStatus.OFFLINE || data.status === driver_entity_1.DriverStatus.BUSY) {
                this.removeFromQueue(data.driverId);
            }
            client.emit('statusChanged', { status: driver.status });
            this.broadcastState();
        }
    }
    async handleTripResponse(data, client) {
        if (data.accepted) {
            const trip = await this.tripsService.acceptTrip(data.tripId);
            if (trip) {
                this.removeFromQueue(data.driverId);
                await this.driversService.updateStatus(data.driverId, driver_entity_1.DriverStatus.BUSY);
                client.emit('tripAccepted', trip);
                this.server.emit('tripStatusUpdate', { tripId: trip.id, status: trip.status });
                this.broadcastState();
            }
        }
        else {
            const trip = await this.tripsService.findOne(data.tripId);
            if (trip) {
                this.assignTripToNextDriver(trip.id, data.driverId);
            }
        }
    }
    async handleCompleteTrip(data, client) {
        const trip = await this.tripsService.completeTrip(data.tripId);
        if (trip) {
            await this.driversService.updateStatus(data.driverId, driver_entity_1.DriverStatus.AVAILABLE);
            client.emit('tripCompleted', trip);
            this.server.emit('tripStatusUpdate', { tripId: trip.id, status: trip.status });
            this.broadcastState();
        }
    }
    async handleGetState(client) {
        const drivers = await this.driversService.getAllWithCoordinates();
        client.emit('stateUpdate', {
            queue: this.queue,
            drivers,
        });
    }
    async handleReorderQueue(data, client) {
        this.queue = data.queue;
        this.broadcastState();
        client.emit('admin:queueReordered', { success: true });
    }
    async handleAdminRemoveFromQueue(data, client) {
        this.removeFromQueue(data.driverId);
        this.broadcastState();
        client.emit('admin:removed', { success: true });
    }
    async handleAdminCreateTrip(data, client) {
        const trip = await this.tripsService.createTrip(data);
        if (this.queue.length > 0) {
            await this.assignTripToNextDriver(trip.id);
        }
        client.emit('admin:tripCreated', trip);
        this.broadcastState();
    }
    async handleManualAssign(data, client) {
        const trip = await this.tripsService.assignTrip(data.tripId, data.driverId);
        if (trip) {
            const driverSocketId = this.driverSockets.get(data.driverId);
            if (driverSocketId) {
                this.server.to(driverSocketId).emit('tripAssigned', trip);
            }
            client.emit('admin:assigned', trip);
        }
    }
    removeFromQueue(driverId) {
        this.queue = this.queue.filter((id) => id !== driverId);
    }
    async assignTripToNextDriver(tripId, skipDriverId) {
        let assigned = false;
        while (this.queue.length > 0 && !assigned) {
            const nextDriverId = this.queue[0];
            if (skipDriverId && nextDriverId === skipDriverId) {
                this.queue.shift();
                continue;
            }
            const trip = await this.tripsService.assignTrip(tripId, nextDriverId);
            if (!trip)
                break;
            const driverSocketId = this.driverSockets.get(nextDriverId);
            if (driverSocketId) {
                this.server.to(driverSocketId).emit('tripAssigned', trip);
                setTimeout(async () => {
                    const currentTrip = await this.tripsService.findOne(tripId);
                    if (currentTrip && currentTrip.status === trip_entity_1.TripStatus.ASSIGNED && currentTrip.driverId === nextDriverId) {
                        this.removeFromQueue(nextDriverId);
                        this.server.to(driverSocketId).emit('tripTimeout', {
                            message: 'Yolculuk ataması zaman aşımına uğradı.',
                        });
                        this.assignTripToNextDriver(tripId);
                    }
                }, TRIP_ACCEPT_TIMEOUT);
                assigned = true;
            }
            else {
                this.queue.shift();
            }
        }
        if (!assigned) {
            this.server.emit('tripStatusUpdate', { tripId, status: 'no_driver_available' });
        }
    }
    async broadcastState() {
        const drivers = await this.driversService.getAllWithCoordinates();
        this.server.emit('stateUpdate', {
            queue: this.queue,
            drivers,
        });
    }
};
exports.QueueGateway = QueueGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], QueueGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('register'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], QueueGateway.prototype, "handleRegister", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('updateLocation'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], QueueGateway.prototype, "handleUpdateLocation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinQueue'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], QueueGateway.prototype, "handleJoinQueue", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveQueue'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], QueueGateway.prototype, "handleLeaveQueue", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('changeStatus'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], QueueGateway.prototype, "handleChangeStatus", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('respondToTrip'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], QueueGateway.prototype, "handleTripResponse", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('completeTrip'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], QueueGateway.prototype, "handleCompleteTrip", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('getState'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], QueueGateway.prototype, "handleGetState", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('admin:reorderQueue'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], QueueGateway.prototype, "handleReorderQueue", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('admin:removeFromQueue'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], QueueGateway.prototype, "handleAdminRemoveFromQueue", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('admin:createTrip'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], QueueGateway.prototype, "handleAdminCreateTrip", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('admin:manualAssign'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], QueueGateway.prototype, "handleManualAssign", null);
exports.QueueGateway = QueueGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: true }),
    __metadata("design:paramtypes", [drivers_service_1.DriversService,
        trips_service_1.TripsService,
        geofence_service_1.GeofenceService])
], QueueGateway);
//# sourceMappingURL=queue.gateway.js.map