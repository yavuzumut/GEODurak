import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';
import { DriversService } from '../drivers/drivers.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private driversService: DriversService,
  ) {}

  async validateUser(phone: string, pass: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { phone } });
    if (user && await bcrypt.compare(pass, user.passwordHash)) {
      const { passwordHash, refreshToken, ...result } = user;
      return result;
    }
    return null;
  }

  async register(data: any) {
    const existing = await this.usersRepository.findOne({ where: { phone: data.phone } });
    if (existing) {
      throw new UnauthorizedException('Bu telefon numarası zaten kayıtlı.');
    }

    // Create the driver details first
    const driver = await this.driversService.create({
      name: data.name,
      phone: data.phone,
      licensePlate: data.licensePlate,
      stationId: data.stationId,
      status: 'available' as any,
    });

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = this.usersRepository.create({
      id: driver.id, // Keep IDs synced
      phone: data.phone,
      passwordHash,
      role: UserRole.DRIVER,
      name: data.name,
    });
    
    await this.usersRepository.save(user);

    return this.login(user);
  }

  async login(user: any) {
    const payload = { phone: user.phone, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Store refresh token in db
    await this.usersRepository.update(user.id, { refreshToken });

    let userIdStr = user.id;
    if (user.role === UserRole.DRIVER) {
      const driver = await this.driversService.findByPhone(user.phone);
      if (driver) {
        userIdStr = driver.id;
      }
    }

    return {
      accessToken,
      refreshToken,
      role: user.role,
      userId: userIdStr,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersRepository.findOne({ where: { id: payload.sub } });
      
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access token
      const newPayload = { phone: user.phone, sub: user.id, role: user.role };
      const accessToken = this.jwtService.sign(newPayload, { expiresIn: '15m' });
      
      return { accessToken, role: user.role };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
