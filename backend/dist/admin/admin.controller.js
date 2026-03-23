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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const drivers_service_1 = require("../drivers/drivers.service");
const trips_service_1 = require("../trips/trips.service");
const stations_service_1 = require("../stations/stations.service");
let AdminController = class AdminController {
    driversService;
    tripsService;
    stationsService;
    constructor(driversService, tripsService, stationsService) {
        this.driversService = driversService;
        this.tripsService = tripsService;
        this.stationsService = stationsService;
    }
    async getAllDrivers() {
        return this.driversService.getAllWithCoordinates();
    }
    async getAllDriversFull() {
        return this.driversService.findAll();
    }
    async getAllStations() {
        return this.stationsService.findAll();
    }
    async createStation(data) {
        const r = (data.radiusMeters || 100) / 111320;
        const lat = data.centerLat;
        const lng = data.centerLng;
        const points = [];
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
        });
    }
    async getAllTrips() {
        return this.tripsService.findAll();
    }
    async getTodayTrips() {
        return this.tripsService.getTodayTrips();
    }
    async getHourlyStats() {
        return this.tripsService.getHourlyStats();
    }
    async createTrip(data) {
        return this.tripsService.createTrip(data);
    }
    async removeDriverFromQueue(id) {
        return { message: 'Use WebSocket admin:removeFromQueue event for real-time queue management' };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('drivers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllDrivers", null);
__decorate([
    (0, common_1.Get)('drivers/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllDriversFull", null);
__decorate([
    (0, common_1.Get)('stations'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllStations", null);
__decorate([
    (0, common_1.Post)('stations'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createStation", null);
__decorate([
    (0, common_1.Get)('trips'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllTrips", null);
__decorate([
    (0, common_1.Get)('trips/today'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTodayTrips", null);
__decorate([
    (0, common_1.Get)('trips/hourly'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getHourlyStats", null);
__decorate([
    (0, common_1.Post)('trips'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createTrip", null);
__decorate([
    (0, common_1.Delete)('drivers/:id/queue'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "removeDriverFromQueue", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [drivers_service_1.DriversService,
        trips_service_1.TripsService,
        stations_service_1.StationsService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map