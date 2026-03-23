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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockLocationService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const station_entity_1 = require("../stations/station.entity");
let MockLocationService = class MockLocationService {
    redis;
    stationRepository;
    constructor(redis, stationRepository) {
        this.redis = redis;
        this.stationRepository = stationRepository;
    }
    async getLocation(driverId) {
        const data = await this.redis.get(`mock_loc:${driverId}`);
        if (!data)
            return null;
        const parsed = JSON.parse(data);
        return { latitude: parsed.lat, longitude: parsed.lng };
    }
    async validateGeofence(driverId, stationId) {
        const mockLoc = await this.getLocation(driverId);
        if (!mockLoc)
            return false;
        const point = {
            type: 'Point',
            coordinates: [mockLoc.longitude, mockLoc.latitude],
        };
        const result = await this.stationRepository.query(`SELECT ST_Contains(geofence, ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)) as "isInside"
       FROM stations WHERE id = $2`, [JSON.stringify(point), stationId]);
        return result?.[0]?.isInside || false;
    }
};
exports.MockLocationService = MockLocationService;
exports.MockLocationService = MockLocationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('REDIS_CLIENT')),
    __param(1, (0, typeorm_2.InjectRepository)(station_entity_1.Station)),
    __metadata("design:paramtypes", [ioredis_1.default,
        typeorm_1.Repository])
], MockLocationService);
//# sourceMappingURL=mock-location.service.js.map