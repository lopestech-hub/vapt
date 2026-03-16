import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { StringValue } from 'ms';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../config/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
      include: { motoboy: { select: { id: true } } },
    });

    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const senhaValida = await bcrypt.compare(dto.senha, usuario.senha_hash);
    if (!senhaValida) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const tokens = await this.gerarTokens(usuario.id, usuario.email, usuario.perfil, usuario.empresa_id);
    await this.salvarRefreshToken(usuario.id, tokens.refresh_token);

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        empresa_id: usuario.empresa_id,
        motoboy_id: usuario.motoboy?.id ?? null,
      },
    };
  }

  async refresh(usuarioId: string, email: string, perfil: string) {
    const tokens = await this.gerarTokens(usuarioId, email, perfil, null);
    await this.salvarRefreshToken(usuarioId, tokens.refresh_token);
    return tokens;
  }

  async logout(usuarioId: string) {
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { refresh_token: null },
    });
  }

  private async gerarTokens(usuarioId: string, email: string, perfil: string, empresaId: string | null) {
    const payload = { sub: usuarioId, email, perfil, empresa_id: empresaId };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '10h') as StringValue,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as StringValue,
      }),
    ]);

    return { access_token, refresh_token };
  }

  private async salvarRefreshToken(usuarioId: string, refreshToken: string) {
    // Salva hash do refresh token — nunca o token em texto puro
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { refresh_token: hash },
    });
  }
}
