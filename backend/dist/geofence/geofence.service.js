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
var GeofenceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeofenceService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const drivers_service_1 = require("../drivers/drivers.service");
const driver_entity_1 = require("../drivers/driver.entity");
let GeofenceService = GeofenceService_1 = class GeofenceService {
    driversService;
    logger = new common_1.Logger(GeofenceService_1.name);
    GEOFENCE_TIMEOUT_MS = 2 * 60 * 1000;
    onDriverRemoved = () => { };
    constructor(driversService) {
        this.driversService = driversService;
    }
    async checkGeofenceViolations() {
        const violators = await this.driversService.getDriversOutsideGeofenceTooLong(this.GEOFENCE_TIMEOUT_MS);
        for (const driver of violators) {
            this.logger.warn(`Driver ${driver.name} (${driver.id}) exceeded geofence timeout. Removing from queue.`);
            this.onDriverRemoved(driver.id);
            await this.driversService.updateStatus(driver.id, driver_entity_1.DriverStatus.OFFLINE);
            await this.driversService.clearGeofenceExitTimer(driver.id);
        }
    }
};
exports.GeofenceService = GeofenceService;
__decorate([
    (0, schedule_1.Interval)(15000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GeofenceService.prototype, "checkGeofenceViolations", null);
exports.GeofenceService = GeofenceService = GeofenceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drivers_service_1.DriversService])
], GeofenceService);
//# sourceMappingURL=geofence.service.js.map