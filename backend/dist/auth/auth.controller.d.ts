import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: any): Promise<{
        accessToken: string;
        refreshToken: string;
        role: any;
        userId: any;
    }>;
    register(body: any): Promise<{
        accessToken: string;
        refreshToken: string;
        role: any;
        userId: any;
    }>;
    refresh(body: any): Promise<{
        accessToken: string;
        role: import("./user.entity").UserRole;
    }>;
    getProfile(req: any): any;
}
