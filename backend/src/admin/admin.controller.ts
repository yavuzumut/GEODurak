import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { DriversService } from '../drivers/drivers.service';
import { TripsService } from '../trips/trips.service';
import { StationsService } from '../stations/stations.service';

@Controller('admin')
export class AdminController {
  constructor(
    private driversService: DriversService,
    private tripsService: TripsService,
    private stationsService: StationsService,
  ) {}

  @Get('drivers')
  async getAllDrivers() {
    return this.driversService.getAllWithCoordinates();
  }

  @Get('drivers/all')
  async getAllDriversFull() {
    return this.driversService.findAll();
  }

  @Get('stations')
  async getAllStations() {
    return this.stationsService.findAll();
  }

  @Post('stations')
  async createStation(@Body() data: { name: string; centerLat: number; centerLng: number; radiusMeters?: number }) {
    // Create a polygon circle approximation around the center point
    const r = (data.radiusMeters || 100) / 111320; // rough degree conversion
    const lat = data.centerLat;
    const lng = data.centerLng;
    const points: string[] = [];
    for (let i = 0; i <= 32; i++) {
      const angle = (i / 32) * 2 * Math.PI;
      points.push(`${lng + r * Math.cos(angle)} ${lat + r * Math.sin(angle)}`);
    }
    const wkt = `SRID=4326;POLYGON((${points.join(',')}))`;

    return this.stationsService.create({
      name: data.name,
      centerLat: data.centerLat,
      centerLng: data.centerLng,
      radiusMeters: data.radiusMeters || 100,
      geofence: () => `ST_GeomFromEWKT('${wkt}')`,
    } as any);
  }

  @Get('trips')
  async getAllTrips() {
    return this.tripsService.findAll();
  }

  @Get('trips/today')
  async getTodayTrips() {
    return this.tripsService.getTodayTrips();
  }

  @Get('trips/hourly')
  async getHourlyStats() {
    return this.tripsService.getHourlyStats();
  }

  @Post('trips')
  async createTrip(@Body() data: { stationId: string; customerName?: string; customerPhone?: string; destination?: string }) {
    return this.tripsService.createTrip(data);
  }

  @Delete('drivers/:id/queue')
  async removeDriverFromQueue(@Param('id') id: string) {
    // This is handled via WebSocket, but we can also provide a REST fallback
    return { message: 'Use WebSocket admin:removeFromQueue event for real-time queue management' };
  }
}
