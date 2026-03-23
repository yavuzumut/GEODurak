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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StationsController = void 0;
const common_1 = require("@nestjs/common");
const stations_service_1 = require("./stations.service");
let StationsController = class StationsController {
    stationsService;
    constructor(stationsService) {
        this.stationsService = stationsService;
    }
    async findAll() {
        const stations = await this.stationsService.findAll();
        return stations.map(s => ({
            id: s.id,
            name: s.name,
            latitude: s.centerLat,
            longitude: s.centerLng
        }));
    }
    async getIstanbulStations() {
        const stations = await this.stationsService.findAll();
        return stations.map(s => ({
            id: s.id,
            name: s.name,
            latitude: s.centerLat,
            longitude: s.centerLng
        }));
    }
};
exports.StationsController = StationsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('istanbul'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StationsController.prototype, "getIstanbulStations", null);
exports.StationsController = StationsController = __decorate([
    (0, common_1.Controller)('stations'),
    __metadata("design:paramtypes", [stations_service_1.StationsService])
], StationsController);
//# sourceMappingURL=stations.controller.js.map