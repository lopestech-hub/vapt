import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';
import { PrismaService } from '../../../config/prisma.service';
import * as bcrypt from 'bcryptjs';

export class CriarMotoboyDto {
  @IsString()
  nome: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(4)
  @MaxLength(4)
  senha: string;

  @IsString()
  cnh: string;

  @IsString()
  placa_moto: string;

  @IsString()
  modelo_moto: string;

  @IsString()
  telefone: string;

  @IsOptional()
  @IsString()
  filial_id?: string;
}

@Injectable()
export class AdminMotoboysService {
  constructor(private prisma: PrismaService) {}

  async listarFiliais(empresaId: string) {
    return this.prisma.filial.findMany({
      where: { empresa_id: empresaId, ativo: true },
      orderBy: { codigo: 'asc' },
      select: { id: true, codigo: true, nome: true },
    });
  }

  async listar(empresaId: string) {
    const motoboys = await this.prisma.motoboy.findMany({
      where: { usuario: { empresa_id: empresaId } },
      include: {
        usuario: { select: { id: true, nome: true, email: true, ativo: true } },
        filial: { select: { id: true, codigo: true, nome: true } },
        _count: { select: { entregas: true } },
      },
      orderBy: { usuario: { nome: 'asc' } },
    });

    return motoboys.map((m) => ({
      id: m.id,
      nome: m.usuario.nome,
      email: m.usuario.email,
      ativo: m.usuario.ativo,
      cnh: m.cnh,
      placa_moto: m.placa_moto,
      modelo_moto: m.modelo_moto,
      telefone: m.telefone,
      online: m.online,
      filial: m.filial,
      total_entregas: m._count.entregas,
      criado_em: m.criado_em,
    }));
  }

  async buscarPorId(id: string, empresaId: string) {
    const m = await this.prisma.motoboy.findFirst({
      where: { id, usuario: { empresa_id: empresaId } },
      include: {
        usuario: { select: { id: true, nome: true, email: true, ativo: true } },
        _count: { select: { entregas: true } },
      },
    });
    if (!m) throw new NotFoundException('Motoboy não encontrado.');
    return {
      id: m.id,
      nome: m.usuario.nome,
      email: m.usuario.email,
      ativo: m.usuario.ativo,
      cnh: m.cnh,
      placa_moto: m.placa_moto,
      modelo_moto: m.modelo_moto,
      telefone: m.telefone,
      online: m.online,
      total_entregas: m._count.entregas,
      criado_em: m.criado_em,
    };
  }

  async criar(dto: CriarMotoboyDto, empresaId: string) {
    const existe = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (existe) throw new ConflictException('E-mail já cadastrado.');

    const senhaHash = await bcrypt.hash(dto.senha, 10);

    const usuario = await this.prisma.usuario.create({
      data: {
        nome: dto.nome,
        email: dto.email,
        senha_hash: senhaHash,
        perfil: 'motoboy',
        empresa_id: empresaId,
        motoboy: {
          create: {
            cnh: dto.cnh,
            placa_moto: dto.placa_moto,
            modelo_moto: dto.modelo_moto,
            telefone: dto.telefone,
            ...(dto.filial_id && { filial_id: dto.filial_id }),
          },
        },
      },
      include: { motoboy: true },
    });

    return { id: usuario.motoboy!.id, nome: usuario.nome, email: usuario.email };
  }

  async toggleAtivo(id: string, empresaId: string) {
    const m = await this.prisma.motoboy.findFirst({
      where: { id, usuario: { empresa_id: empresaId } },
      include: { usuario: true },
    });
    if (!m) throw new NotFoundException('Motoboy não encontrado.');

    await this.prisma.usuario.update({
      where: { id: m.usuario_id },
      data: { ativo: !m.usuario.ativo },
    });

    return { ativo: !m.usuario.ativo };
  }
}
