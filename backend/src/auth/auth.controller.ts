import { Controller, Post, Body, UnauthorizedException, Get, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.phone, body.password);
    if (!user) {
      throw new UnauthorizedException('Geçersiz telefon veya şifre');
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() body: any) {
    if (!body.phone || !body.password || !body.name || !body.licensePlate || !body.stationId) {
      throw new UnauthorizedException('Lütfen tüm alanları doldurun');
    }
    return this.authService.register(body);
  }

  @Post('refresh')
  async refresh(@Body() body: any) {
    if (!body.refreshToken) throw new UnauthorizedException('Refresh token missing');
    return this.authService.refresh(body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: any) {
    return req.user;
  }
}
