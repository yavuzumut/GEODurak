import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DriversService } from '../drivers/drivers.service';
import { TripsService } from '../trips/trips.service';
import { GeofenceService } from '../geofence/geofence.service';
import { DriverStatus } from '../drivers/driver.entity';
import { TripStatus } from '../trips/trip.entity';

const TRIP_ACCEPT_TIMEOUT = 30000; // 30 seconds

@WebSocketGateway({ cors: true })
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly driversService: DriversService,
    private readonly tripsService: TripsService,
    private readonly geofenceService: GeofenceService,
  ) { }

  // driverId -> socketId mapping
  // Sürücüyü sıradan atmak için kullanılan eksik fonksiyon
  evictDriver(driverId: string) {
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
  private driverSockets: Map<string, string> = new Map();
  private socketDrivers: Map<string, string> = new Map();
  private queue: string[] = [];

  afterInit() {
    // Wire up geofence service callback
    this.geofenceService.onDriverRemoved = (driverId: string) => {
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

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const driverId = this.socketDrivers.get(client.id);
    if (driverId) {
      this.driverSockets.delete(driverId);
      this.socketDrivers.delete(client.id);
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('register')
  async handleRegister(
    @MessageBody() data: { driverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.driverSockets.set(data.driverId, client.id);
    this.socketDrivers.set(client.id, data.driverId);
    client.emit('registered', { success: true });
    this.broadcastState();
  }

  @SubscribeMessage('updateLocation')
  async handleUpdateLocation(
    @MessageBody() data: { driverId: string; latitude: number; longitude: number; stationId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const driver = await this.driversService.updateLocation(data.driverId, data.latitude, data.longitude, data.stationId);

      if (driver) {
        if (!driver.isInsideGeofence && this.queue.includes(driver.id)) {
          // Send warning first
          client.emit('geofenceWarning', {
            message: 'Durak sınırından çıkıyorsunuz! 2 dakika içinde geri dönün.',
            type: 'warning',
          });
        }

        client.emit('locationUpdated', {
          isInsideGeofence: driver.isInsideGeofence,
          status: driver.status,
        });
      } else {
        client.emit('error', { message: 'Driver not found' });
      }

      this.broadcastState();
    } catch (e) {
      console.error(e);
      client.emit('error', { message: 'Could not update location.' });
    }
  }

  @SubscribeMessage('joinQueue')
  async handleJoinQueue(
    @MessageBody() data: { driverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const driver = await this.driversService.findOne(data.driverId);
      if (driver && driver.isInsideGeofence && driver.status === DriverStatus.AVAILABLE) {
        if (!this.queue.includes(driver.id)) {
          this.queue.push(driver.id);
          await this.driversService.updateStatus(driver.id, DriverStatus.AVAILABLE);
        }
        client.emit('joinedQueue', {
          position: this.queue.indexOf(driver.id) + 1,
          total: this.queue.length,
        });
        this.broadcastState();
      } else {
        const reason = !driver ? 'Sürücü bulunamadı' :
          !driver.isInsideGeofence ? 'Durak sınırı dışındasınız' :
            'Durumunuz müsait değil';
        client.emit('error', { message: `Sıraya girilemedi: ${reason}` });
      }
    } catch (e) {
      console.error(e);
      client.emit('error', { message: 'Sıraya girerken hata oluştu.' });
    }
  }

  @SubscribeMessage('leaveQueue')
  async handleLeaveQueue(
    @MessageBody() data: { driverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.removeFromQueue(data.driverId);
    client.emit('leftQueue', { message: 'Sıradan ayrıldınız.' });
    this.broadcastState();
  }

  @SubscribeMessage('changeStatus')
  async handleChangeStatus(
    @MessageBody() data: { driverId: string; status: DriverStatus },
    @ConnectedSocket() client: Socket,
  ) {
    const driver = await this.driversService.updateStatus(data.driverId, data.status);
    if (driver) {
      if (data.status === DriverStatus.OFFLINE || data.status === DriverStatus.BUSY) {
        this.removeFromQueue(data.driverId);
      }
      client.emit('statusChanged', { status: driver.status });
      this.broadcastState();
    }
  }

  @SubscribeMessage('respondToTrip')
  async handleTripResponse(
    @MessageBody() data: { tripId: string; driverId: string; accepted: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    if (data.accepted) {
      const trip = await this.tripsService.acceptTrip(data.tripId);
      if (trip) {
        // Remove driver from queue and set busy
        this.removeFromQueue(data.driverId);
        await this.driversService.updateStatus(data.driverId, DriverStatus.BUSY);
        client.emit('tripAccepted', trip);
        this.server.emit('tripStatusUpdate', { tripId: trip.id, status: trip.status });
        this.broadcastState();
      }
    } else {
      // Rejected: try next driver in queue
      const trip = await this.tripsService.findOne(data.tripId);
      if (trip) {
        this.assignTripToNextDriver(trip.id, data.driverId);
      }
    }
  }

  @SubscribeMessage('completeTrip')
  async handleCompleteTrip(
    @MessageBody() data: { tripId: string; driverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const trip = await this.tripsService.completeTrip(data.tripId);
    if (trip) {
      await this.driversService.updateStatus(data.driverId, DriverStatus.AVAILABLE);
      client.emit('tripCompleted', trip);
      this.server.emit('tripStatusUpdate', { tripId: trip.id, status: trip.status });
      this.broadcastState();
    }
  }

  @SubscribeMessage('getState')
  async handleGetState(@ConnectedSocket() client: Socket) {
    const drivers = await this.driversService.getAllWithCoordinates();
    client.emit('stateUpdate', {
      queue: this.queue,
      drivers,
    });
  }

  // --- Admin events ---
  @SubscribeMessage('admin:reorderQueue')
  async handleReorderQueue(
    @MessageBody() data: { queue: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    this.queue = data.queue;
    this.broadcastState();
    client.emit('admin:queueReordered', { success: true });
  }

  @SubscribeMessage('admin:removeFromQueue')
  async handleAdminRemoveFromQueue(
    @MessageBody() data: { driverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.removeFromQueue(data.driverId);
    this.broadcastState();
    client.emit('admin:removed', { success: true });
  }

  @SubscribeMessage('admin:createTrip')
  async handleAdminCreateTrip(
    @MessageBody() data: { stationId: string; customerName?: string; customerPhone?: string; destination?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const trip = await this.tripsService.createTrip(data);
    // Auto-assign to first driver in queue
    if (this.queue.length > 0) {
      await this.assignTripToNextDriver(trip.id);
    }
    client.emit('admin:tripCreated', trip);
    this.broadcastState();
  }

  @SubscribeMessage('admin:manualAssign')
  async handleManualAssign(
    @MessageBody() data: { tripId: string; driverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const trip = await this.tripsService.assignTrip(data.tripId, data.driverId);
    if (trip) {
      const driverSocketId = this.driverSockets.get(data.driverId);
      if (driverSocketId) {
        this.server.to(driverSocketId).emit('tripAssigned', trip);
      }
      client.emit('admin:assigned', trip);
    }
  }

  @SubscribeMessage('admin:cancelTrip')
  async handleAdminCancelTrip(
    @MessageBody() data: { tripId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const trip = await this.tripsService.cancelTrip(data.tripId);
    if (trip) {
      if (trip.driverId) {
        const driverSocketId = this.driverSockets.get(trip.driverId);
        if (driverSocketId) {
          this.server.to(driverSocketId).emit('tripCancelled', { tripId: trip.id });
        }
      }
      this.server.emit('tripStatusUpdate', { tripId: trip.id, status: trip.status });
      this.broadcastState();
      client.emit('admin:tripCancelled', { success: true });
    }
  }

  @SubscribeMessage('admin:forceOffline')
  async handleAdminForceOffline(
    @MessageBody() data: { driverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const driver = await this.driversService.updateStatus(data.driverId, DriverStatus.OFFLINE);
    if (driver) {
      this.removeFromQueue(data.driverId);
      const driverSocketId = this.driverSockets.get(data.driverId);
      if (driverSocketId) {
        this.server.to(driverSocketId).emit('admin:kicked', { message: 'Yönetici tarafından çevrimdışı yapıldınız.' });
      }
      this.broadcastState();
      client.emit('admin:forcedOffline', { success: true });
    }
  }

  // --- Helpers ---
  private removeFromQueue(driverId: string) {
    this.queue = this.queue.filter((id) => id !== driverId);
  }

  private async assignTripToNextDriver(tripId: string, skipDriverId?: string) {
    let assigned = false;

    while (this.queue.length > 0 && !assigned) {
      const nextDriverId = this.queue[0];

      if (skipDriverId && nextDriverId === skipDriverId) {
        this.queue.shift();
        continue;
      }

      const trip = await this.tripsService.assignTrip(tripId, nextDriverId);
      if (!trip) break;

      const driverSocketId = this.driverSockets.get(nextDriverId);
      if (driverSocketId) {
        this.server.to(driverSocketId).emit('tripAssigned', trip);

        // Set a timeout: if driver doesn't respond in 30s, skip
        setTimeout(async () => {
          const currentTrip = await this.tripsService.findOne(tripId);
          if (currentTrip && currentTrip.status === TripStatus.ASSIGNED && currentTrip.driverId === nextDriverId) {
            // Driver didn't respond, skip
            this.removeFromQueue(nextDriverId);
            this.server.to(driverSocketId).emit('tripTimeout', {
              message: 'Yolculuk ataması zaman aşımına uğradı.',
            });
            this.assignTripToNextDriver(tripId);
          }
        }, TRIP_ACCEPT_TIMEOUT);

        assigned = true;
      } else {
        // Driver not connected, skip
        this.queue.shift();
      }
    }

    if (!assigned) {
      // No driver available
      this.server.emit('tripStatusUpdate', { tripId, status: 'no_driver_available' });
    }
  }

  private async broadcastState() {
    const drivers = await this.driversService.getAllWithCoordinates();
    this.server.emit('stateUpdate', {
      queue: this.queue,
      drivers,
    });
  }
}
