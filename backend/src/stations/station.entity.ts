import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('stations')
export class Station {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
  })
  geofence: any;

  @Column({ type: 'int', default: 100 })
  radiusMeters: number;

  @Column({ type: 'float' })
  centerLat: number;

  @Column({ type: 'float' })
  centerLng: number;

  @CreateDateColumn()
  createdAt: Date;
}
