import { OnModuleInit } from '@nestjs/common';
import { QueueGateway } from './queue.gateway';
import Redis from 'ioredis';
export declare class QueueEvictionService implements OnModuleInit {
    private readonly redis;
    private readonly queueGateway;
    private readonly logger;
    private subscriber;
    constructor(redis: Redis, queueGateway: QueueGateway);
    onModuleInit(): Promise<void>;
}
