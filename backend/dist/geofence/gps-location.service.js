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
exports.GPSLocationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const driver_entity_1 = require("../drivers/driver.entity");
let GPSLocationService = class GPSLocationService {
    driversRepository;
    constructor(driversRepository) {
        this.driversRepository = driversRepository;
    }
    async getLocation(driverId) {
        const driver = await this.driversRepository.findOne({ where: { id: driverId } });
        if (!driver || !driver.location)
            return null;
        return {
            longitude: driver.location.coordinates[0],
            latitude: driver.location.coordinates[1],
        };
    }
    async validateGeofence(driverId, stationId) {
        const result = await this.driversRepository.query(`SELECT ST_Contains(s.geofence, d.location) as "isInside"
       FROM drivers d, stations s 
       WHERE d.id = $1 AND s.id = $2`, [driverId, stationId]);
        return result?.[0]?.isInside || false;
    }
};
exports.GPSLocationService = GPSLocationService;
exports.GPSLocationService = GPSLocationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(driver_entity_1.Driver)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GPSLocationService);
//# sourceMappingURL=gps-location.service.js.map