import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { IsString } from 'class-validator';
import { PrismaService } from '../../../config/prisma.service';

export class CriarFilialDto {
  @IsString()
  codigo: string;

  @IsString()
  nome: string;
}

@Injectable()
export class AdminFiliaisService {
  constructor(private prisma: PrismaService) {}

  async listar(empresaId: string) {
    return this.prisma.filial.findMany({
      where: { empresa_id: empresaId },
      orderBy: { codigo: 'asc' },
      include: { _count: { select: { motoboys: true } } },
    });
  }

  async criar(dto: CriarFilialDto, empresaId: string) {
    const existe = await this.prisma.filial.findFirst({
      where: { empresa_id: empresaId, codigo: dto.codigo },
    });
    if (existe) throw new ConflictException('Código de filial já cadastrado nesta empresa.');

    return this.prisma.filial.create({
      data: { codigo: dto.codigo, nome: dto.nome, empresa_id: empresaId },
    });
  }

  async toggleAtivo(id: string, empresaId: string) {
    const filial = await this.prisma.filial.findFirst({
      where: { id, empresa_id: empresaId },
    });
    if (!filial) throw new NotFoundException('Filial não encontrada.');

    return this.prisma.filial.update({
      where: { id },
      data: { ativo: !filial.ativo },
    });
  }
}
