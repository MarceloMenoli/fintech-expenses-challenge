import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UsersService } from '../users/users.module';

interface AuthRequest extends Request {
  userId: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('Autenticação necessária.');
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      if (typeof payload.sub !== 'string' || !(await this.users.findPublicById(payload.sub)))
        throw new Error('Invalid subject');
      req.userId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException('Sessão inválida ou expirada. Entre novamente.');
    }
  }
}

export const UserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    context.switchToHttp().getRequest<AuthRequest>().userId,
);
