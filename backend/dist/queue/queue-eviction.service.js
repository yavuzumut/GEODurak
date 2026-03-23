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
var QueueEvictionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueEvictionService = void 0;
const common_1 = require("@nestjs/common");
const queue_gateway_1 = require("./queue.gateway");
const ioredis_1 = __importDefault(require("ioredis"));
let QueueEvictionService = QueueEvictionService_1 = class QueueEvictionService {
    redis;
    queueGateway;
    logger = new common_1.Logger(QueueEvictionService_1.name);
    subscriber;
    constructor(redis, queueGateway) {
        this.redis = redis;
        this.queueGateway = queueGateway;
        this.subscriber = new ioredis_1.default({ host: 'localhost', port: 6379 });
    }
    async onModuleInit() {
        try {
            await this.redis.config('SET', 'notify-keyspace-events', 'Ex');
            this.subscriber.subscribe('__keyevent@0__:expired', (err) => {
                if (err)
                    this.logger.error('Failed to subscribe to Redis expired events', err);
            });
            this.subscriber.on('message', (channel, message) => {
                if (channel === '__keyevent@0__:expired' && message.startsWith('heartbeat:')) {
                    const driverId = message.split(':')[1];
                    this.logger.warn(`Heartbeat expired for driver ${driverId}. Evicting from queue.`);
                    this.queueGateway.evictDriver(driverId);
                }
            });
            console.log('Redis Eviction Policy (Heartbeat) listener started.');
        }
        catch (e) {
            this.logger.error('Failed to initialize Redis Eviction Policy.', e);
        }
    }
};
exports.QueueEvictionService = QueueEvictionService;
exports.QueueEvictionService = QueueEvictionService = QueueEvictionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [ioredis_1.default,
        queue_gateway_1.QueueGateway])
], QueueEvictionService);
//# sourceMappingURL=queue-eviction.service.js.map