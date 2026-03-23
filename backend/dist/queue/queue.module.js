"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueModule = void 0;
const common_1 = require("@nestjs/common");
const queue_gateway_1 = require("./queue.gateway");
const drivers_module_1 = require("../drivers/drivers.module");
const trips_module_1 = require("../trips/trips.module");
const geofence_module_1 = require("../geofence/geofence.module");
let QueueModule = class QueueModule {
};
exports.QueueModule = QueueModule;
exports.QueueModule = QueueModule = __decorate([
    (0, common_1.Module)({
        imports: [drivers_module_1.DriversModule, trips_module_1.TripsModule, geofence_module_1.GeofenceModule],
        providers: [queue_gateway_1.QueueGateway],
    })
], QueueModule);
//# sourceMappingURL=queue.module.js.map