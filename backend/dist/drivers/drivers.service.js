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
exports.DriversService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const driver_entity_1 = require("./driver.entity");
let DriversService = class DriversService {
    driversRepository;
    constructor(driversRepository) {
        this.driversRepository = driversRepository;
    }
    async create(driverData) {
        const driver = this.driversRepository.create(driverData);
        return this.driversRepository.save(driver);
    }
    async findAll() {
        return this.driversRepository.find();
    }
    async findOne(id) {
        return this.driversRepository.findOne({ where: { id } });
    }
    async findByPhone(phone) {
        return this.driversRepository.findOne({ where: { phone } });
    }
    async updateLocation(driverId, latitude, longitude, stationId) {
        const point = {
            type: 'Point',
            coordinates: [longitude, latitude],
        };
        const driverInfo = await this.driversRepository.findOne({ where: { id: driverId } });
        if (!driverInfo)
            return null;
        const currentStationId = stationId || driverInfo.stationId;
        if (currentStationId) {
            await this.driversRepository.query(`UPDATE drivers SET 
          location = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326),
          "isInsideGeofence" = (
            SELECT ST_Contains(s.geofence, ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))
            FROM stations s WHERE s.id = $2
          ),
          "stationId" = $2
         WHERE id = $3`, [JSON.stringify(point), currentStationId, driverId]);
        }
        else {
            await this.driversRepository.query(`UPDATE drivers SET 
          location = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)
         WHERE id = $2`, [JSON.stringify(point), driverId]);
        }
        const driver = await this.driversRepository.findOne({ where: { id: driverId } });
        if (driver && !driver.isInsideGeofence && !driver.lastGeofenceExitAt) {
            await this.driversRepository.update(driverId, { lastGeofenceExitAt: new Date() });
            driver.lastGeofenceExitAt = new Date();
        }
        else if (driver && driver.isInsideGeofence && driver.lastGeofenceExitAt) {
            await this.driversRepository.update(driverId, { lastGeofenceExitAt: null });
            driver.lastGeofenceExitAt = null;
        }
        return driver;
    }
    async updateStatus(driverId, status) {
        await this.driversRepository.update(driverId, { status });
        return this.driversRepository.findOne({ where: { id: driverId } });
    }
    async clearGeofenceExitTimer(driverId) {
        await this.driversRepository.update(driverId, { lastGeofenceExitAt: null });
    }
    async getDriversOutsideGeofenceTooLong(timeoutMs) {
        const cutoff = new Date(Date.now() - timeoutMs);
        return this.driversRepository
            .createQueryBuilder('driver')
            .where('"isInsideGeofence" = false')
            .andWhere('"lastGeofenceExitAt" IS NOT NULL')
            .andWhere('"lastGeofenceExitAt" <= :cutoff', { cutoff })
            .andWhere('driver.status != :offline', { offline: driver_entity_1.DriverStatus.OFFLINE })
            .getMany();
    }
    async remove(id) {
        await this.driversRepository.delete(id);
        return { deleted: true };
    }
    async getAllWithCoordinates() {
        return this.driversRepository.query(`
      SELECT 
        id, name, "licensePlate", phone, status, 
        "isInsideGeofence", "joinedQueueAt", "stationId",
        ST_X(location::geometry) as longitude,
        ST_Y(location::geometry) as latitude
      FROM drivers
      WHERE location IS NOT NULL
    `);
    }
};
exports.DriversService = DriversService;
exports.DriversService = DriversService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(driver_entity_1.Driver)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DriversService);
//# sourceMappingURL=drivers.service.js.map