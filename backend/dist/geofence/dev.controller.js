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
exports.DevController = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
let DevController = class DevController {
    redis;
    constructor(redis) {
        this.redis = redis;
    }
    async setMockLocation(body) {
        if (process.env.NODE_ENV === 'production' || process.env.TEST_MODE !== 'true') {
            return { success: false, message: 'Test mode is disabled.' };
        }
        const { driverId, lat, lng, speed, heading } = body;
        const payload = JSON.stringify({ lat, lng, speed, heading, updatedAt: new Date().toISOString() });
        await this.redis.set(`mock_loc:${driverId}`, payload, 'EX', 1800);
        return { success: true, message: `Mock location set for driver ${driverId}` };
    }
};
exports.DevController = DevController;
__decorate([
    (0, common_1.Post)('mock-location'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DevController.prototype, "setMockLocation", null);
exports.DevController = DevController = __decorate([
    (0, common_1.Controller)('v1/dev'),
    __param(0, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [ioredis_1.default])
], DevController);
//# sourceMappingURL=dev.controller.js.map