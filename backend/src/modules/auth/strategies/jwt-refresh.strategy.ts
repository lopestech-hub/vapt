import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../../config/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private prisma: PrismaService) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET!,
      passReqToCallback: true,
    } as any);
  }

  async validate(req: Request, payload: { sub: string }) {
    const refreshToken = req.body?.refresh_token;

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, perfil: true, ativo: true, refresh_token: true },
    });

    if (!usuario || !usuario.ativo || !usuario.refresh_token) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const tokenValido = await bcrypt.compare(refreshToken, usuario.refresh_token);
    if (!tokenValido) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    return usuario;
  }
}
