import { Body, Controller, Get, HttpCode, Injectable, Module, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { UsersModule, UsersService } from '../users/users.module';
import { LoginDto, RegisterDto } from './auth.dto';
import { AuthGuard, UserId } from './auth.guard';

@Injectable()
class AuthService {
  constructor(private readonly users: UsersService, private readonly jwt: JwtService) {}

  async register(dto: RegisterDto) {
    const passwordHash = await hash(dto.password, 12);
    const user = await this.users.create({ name: dto.name, email: dto.email, passwordHash });
    return { user, accessToken: await this.jwt.signAsync({ sub: user.id }) };
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !await compare(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }
    return {
      user: { id: user.id, name: user.name, email: user.email },
      accessToken: await this.jwt.signAsync({ sub: user.id }),
    };
  }
}

@Controller('auth')
class AuthController {
  constructor(private readonly auth: AuthService, private readonly users: UsersService) {}
  @Post('register')
  register(@Body() dto: RegisterDto) { return this.auth.register(dto); }
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) { return this.auth.login(dto); }
  @Get('me')
  @UseGuards(AuthGuard)
  me(@UserId() id: string) { return this.users.findPublicById(id); }
}

@Module({
  imports: [UsersModule, JwtModule.registerAsync({ useFactory: () => ({
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 3600), algorithm: 'HS256' },
    verifyOptions: { algorithms: ['HS256'] },
  }) })],
  controllers: [AuthController], providers: [AuthService, AuthGuard], exports: [AuthGuard, JwtModule, UsersModule],
})
export class AuthModule {}
