export declare enum UserRole {
    DRIVER = "driver",
    ADMIN = "admin"
}
export declare class User {
    id: string;
    phone: string;
    passwordHash: string;
    role: UserRole;
    name: string;
    refreshToken: string;
    createdAt: Date;
    updatedAt: Date;
}
