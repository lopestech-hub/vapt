import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';
import { PrismaService } from '../../../config/prisma.service';
import * as bcrypt from 'bcryptjs';

export class CriarGestorDto {
  @IsString()
  nome: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(4)
  @MaxLength(4)
  senha: string;
}

@Injectable()
export class AdminGestoresService {
  constructor(private prisma: PrismaService) {}

  async listar(empresaId: string) {
    const gestores = await this.prisma.usuario.findMany({
      where: { empresa_id: empresaId, perfil: 'gestor' },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true, email: true, ativo: true, criado_em: true },
    });
    return gestores;
  }

  async criar(dto: CriarGestorDto, empresaId: string) {
    const existe = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (existe) throw new ConflictException('E-mail já cadastrado.');

    const senhaHash = await bcrypt.hash(dto.senha, 10);

    const gestor = await this.prisma.usuario.create({
      data: {
        nome: dto.nome,
        email: dto.email,
        senha_hash: senhaHash,
        perfil: 'gestor',
        empresa_id: empresaId,
      },
      select: { id: true, nome: true, email: true, ativo: true, criado_em: true },
    });

    return gestor;
  }

  async toggleAtivo(id: string, empresaId: string) {
    const gestor = await this.prisma.usuario.findFirst({
      where: { id, empresa_id: empresaId, perfil: 'gestor' },
    });
    if (!gestor) throw new NotFoundException('Gestor não encontrado.');

    await this.prisma.usuario.update({
      where: { id },
      data: { ativo: !gestor.ativo },
    });

    return { ativo: !gestor.ativo };
  }
}
