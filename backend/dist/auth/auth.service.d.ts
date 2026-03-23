import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from './user.entity';
import { DriversService } from '../drivers/drivers.service';
export declare class AuthService {
    private usersRepository;
    private jwtService;
    private driversService;
    constructor(usersRepository: Repository<User>, jwtService: JwtService, driversService: DriversService);
    validateUser(phone: string, pass: string): Promise<any>;
    register(data: any): Promise<{
        accessToken: string;
        refreshToken: string;
        role: any;
        userId: any;
    }>;
    login(user: any): Promise<{
        accessToken: string;
        refreshToken: string;
        role: any;
        userId: any;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        role: UserRole;
    }>;
}
