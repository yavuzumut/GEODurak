import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Station } from './station.entity';

@Injectable()
export class StationsService {
  constructor(
    @InjectRepository(Station)
    private stationsRepo: Repository<Station>,
  ) {}

  async findAll(): Promise<Station[]> {
    return this.stationsRepo.find();
  }

  async findOne(id: string): Promise<Station | null> {
    return this.stationsRepo.findOne({ where: { id } });
  }

  async create(data: Partial<Station>): Promise<Station> {
    const station = this.stationsRepo.create(data);
    return this.stationsRepo.save(station);
  }

  async getGeofenceWKT(stationId: string): Promise<string | null> {
    const result = await this.stationsRepo.query(
      `SELECT ST_AsEWKT(geofence) as wkt FROM stations WHERE id = $1`,
      [stationId],
    );
    return result.length > 0 ? result[0].wkt : null;
  }
}
