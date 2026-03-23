import { StationsService } from './stations.service';
export declare class StationsController {
    private readonly stationsService;
    constructor(stationsService: StationsService);
    findAll(): Promise<{
        id: string;
        name: string;
        latitude: number;
        longitude: number;
    }[]>;
    getIstanbulStations(): Promise<{
        id: string;
        name: string;
        latitude: number;
        longitude: number;
    }[]>;
}
