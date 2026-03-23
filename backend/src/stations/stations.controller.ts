import { Controller, Get } from '@nestjs/common';
import { StationsService } from './stations.service';

@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Get()
  async findAll() {
    const stations = await this.stationsService.findAll();
    return stations.map(s => ({
      id: s.id,
      name: s.name,
      latitude: s.centerLat,
      longitude: s.centerLng
    }));
  }

  @Get('istanbul')
  async getIstanbulStations() {
    const stations = await this.stationsService.findAll();
    return stations.map(s => ({
      id: s.id,
      name: s.name,
      latitude: s.centerLat,
      longitude: s.centerLng
    }));
  }
}
