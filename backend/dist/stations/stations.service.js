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
exports.StationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const station_entity_1 = require("./station.entity");
let StationsService = class StationsService {
    stationsRepo;
    constructor(stationsRepo) {
        this.stationsRepo = stationsRepo;
    }
    async findAll() {
        return this.stationsRepo.find();
    }
    async findOne(id) {
        return this.stationsRepo.findOne({ where: { id } });
    }
    async create(data) {
        const station = this.stationsRepo.create(data);
        return this.stationsRepo.save(station);
    }
    async getGeofenceWKT(stationId) {
        const result = await this.stationsRepo.query(`SELECT ST_AsEWKT(geofence) as wkt FROM stations WHERE id = $1`, [stationId]);
        return result.length > 0 ? result[0].wkt : null;
    }
};
exports.StationsService = StationsService;
exports.StationsService = StationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(station_entity_1.Station)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], StationsService);
//# sourceMappingURL=stations.service.js.map