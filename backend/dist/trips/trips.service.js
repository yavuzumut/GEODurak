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
exports.TripsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const trip_entity_1 = require("./trip.entity");
const drivers_service_1 = require("../drivers/drivers.service");
let TripsService = class TripsService {
    tripsRepo;
    driversService;
    constructor(tripsRepo, driversService) {
        this.tripsRepo = tripsRepo;
        this.driversService = driversService;
    }
    async createTrip(data) {
        const trip = this.tripsRepo.create({ ...data, status: trip_entity_1.TripStatus.PENDING });
        return this.tripsRepo.save(trip);
    }
    async findAll() {
        return this.tripsRepo.find({ order: { createdAt: 'DESC' } });
    }
    async findOne(id) {
        return this.tripsRepo.findOne({ where: { id } });
    }
    async assignTrip(tripId, driverId) {
        await this.tripsRepo.update(tripId, {
            driverId,
            status: trip_entity_1.TripStatus.ASSIGNED,
            assignedAt: new Date(),
        });
        return this.tripsRepo.findOne({ where: { id: tripId } });
    }
    async acceptTrip(tripId) {
        await this.tripsRepo.update(tripId, {
            status: trip_entity_1.TripStatus.ACCEPTED,
            acceptedAt: new Date(),
        });
        return this.tripsRepo.findOne({ where: { id: tripId } });
    }
    async completeTrip(tripId) {
        await this.tripsRepo.update(tripId, {
            status: trip_entity_1.TripStatus.COMPLETED,
            completedAt: new Date(),
        });
        return this.tripsRepo.findOne({ where: { id: tripId } });
    }
    async cancelTrip(tripId) {
        await this.tripsRepo.update(tripId, {
            status: trip_entity_1.TripStatus.CANCELLED,
        });
        return this.tripsRepo.findOne({ where: { id: tripId } });
    }
    async remove(id) {
        await this.tripsRepo.delete(id);
        return { deleted: true };
    }
    async getTodayTrips() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return this.tripsRepo
            .createQueryBuilder('trip')
            .where('trip.createdAt >= :today', { today })
            .orderBy('trip.createdAt', 'DESC')
            .getMany();
    }
    async getHourlyStats() {
        return this.tripsRepo.query(`
      SELECT 
        EXTRACT(HOUR FROM "createdAt") as hour,
        COUNT(*) as count
      FROM trips
      WHERE "createdAt" >= CURRENT_DATE
      GROUP BY hour
      ORDER BY hour
    `);
    }
};
exports.TripsService = TripsService;
exports.TripsService = TripsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(trip_entity_1.Trip)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        drivers_service_1.DriversService])
], TripsService);
//# sourceMappingURL=trips.service.js.map