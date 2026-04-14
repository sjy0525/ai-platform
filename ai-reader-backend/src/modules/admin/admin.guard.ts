import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

interface AdminJwtPayload {
  sub: string;
  username: string;
  role?: string;
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      throw new UnauthorizedException('缺少管理员令牌');
    }

    try {
      const payload = this.jwtService.verify<AdminJwtPayload>(token, {
        secret:
          this.configService.get<string>('JWT_SECRET') || 'ai-reader-secret-key',
      });

      if (payload.role !== 'admin') {
        throw new UnauthorizedException('管理员权限不足');
      }

      (request as Request & { admin?: AdminJwtPayload }).admin = payload;
      return true;
    } catch {
      throw new UnauthorizedException('管理员登录已失效');
    }
  }
}
