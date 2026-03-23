import Redis from 'ioredis';
export declare class DevController {
    private readonly redis;
    constructor(redis: Redis);
    setMockLocation(body: {
        driverId: string;
        lat: number;
        lng: number;
        speed?: number;
        heading?: number;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
