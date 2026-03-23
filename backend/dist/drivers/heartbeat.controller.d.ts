import Redis from 'ioredis';
export declare class HeartbeatController {
    private readonly redis;
    constructor(redis: Redis);
    heartbeat(body: {
        driverId: string;
    }): Promise<{
        success: boolean;
    }>;
}
