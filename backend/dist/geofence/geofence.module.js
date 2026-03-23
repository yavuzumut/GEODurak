"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeofenceModule = void 0;
const common_1 = require("@nestjs/common");
const geofence_service_1 = require("./geofence.service");
const drivers_module_1 = require("../drivers/drivers.module");
const typeorm_1 = require("@nestjs/typeorm");
const driver_entity_1 = require("../drivers/driver.entity");
const station_entity_1 = require("../stations/station.entity");
const gps_location_service_1 = require("./gps-location.service");
const mock_location_service_1 = require("./mock-location.service");
const dev_controller_1 = require("./dev.controller");
const LocationServiceProvider = {
    provide: 'ILocationService',
    useFactory: (gps, mock) => {
        return process.env.NODE_ENV !== 'production' && process.env.TEST_MODE === 'true'
            ? mock
            : gps;
    },
    inject: [gps_location_service_1.GPSLocationService, mock_location_service_1.MockLocationService]
};
let GeofenceModule = class GeofenceModule {
};
exports.GeofenceModule = GeofenceModule;
exports.GeofenceModule = GeofenceModule = __decorate([
    (0, common_1.Module)({
        imports: [drivers_module_1.DriversModule, typeorm_1.TypeOrmModule.forFeature([driver_entity_1.Driver, station_entity_1.Station])],
        controllers: [dev_controller_1.DevController],
        providers: [geofence_service_1.GeofenceService, gps_location_service_1.GPSLocationService, mock_location_service_1.MockLocationService, LocationServiceProvider],
        exports: [geofence_service_1.GeofenceService, LocationServiceProvider],
    })
], GeofenceModule);
//# sourceMappingURL=geofence.module.js.map