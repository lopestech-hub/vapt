import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';

export class CriarEntregaDto {
  motoboy_id: string;
  cliente_nome: string;
  cliente_telefone?: string;
  endereco_origem: string;
  endereco_destino: string;
  observacoes?: string;
}

@Injectable()
export class AdminEntregasService {
  constructor(private prisma: PrismaService) {}

  private transformar(e: any) {
    return {
      id: e.id,
      status: e.status,
      cliente_nome: e.cliente_nome,
      cliente_telefone: e.cliente_telefone,
      endereco_origem: e.endereco_origem,
      endereco_destino: e.endereco_destino,
      observacoes: e.observacoes,
      comprovante_url: e.comprovante_url,
      distancia_km: e.distancia_km ? Number(e.distancia_km) : null,
      iniciada_em: e.iniciada_em,
      concluida_em: e.concluida_em,
      criado_em: e.criado_em,
      motoboy: e.motoboy
        ? { id: e.motoboy.id, nome: e.motoboy.usuario?.nome, placa: e.motoboy.placa_moto }
        : null,
    };
  }

  async listar(status?: string) {
    const where = status ? { status: status as any } : {};
    const entregas = await this.prisma.entrega.findMany({
      where,
      include: {
        motoboy: { include: { usuario: { select: { nome: true } } } },
      },
      orderBy: { criado_em: 'desc' },
    });
    return entregas.map((e) => this.transformar(e));
  }

  async buscarPorId(id: string) {
    const e = await this.prisma.entrega.findUnique({
      where: { id },
      include: { motoboy: { include: { usuario: { select: { nome: true } } } } },
    });
    if (!e) throw new NotFoundException('Entrega não encontrada.');
    return this.transformar(e);
  }

  async criar(dto: CriarEntregaDto) {
    const motoboy = await this.prisma.motoboy.findUnique({ where: { id: dto.motoboy_id } });
    if (!motoboy) throw new NotFoundException('Motoboy não encontrado.');

    const entrega = await this.prisma.entrega.create({
      data: {
        motoboy_id: dto.motoboy_id,
        cliente_nome: dto.cliente_nome,
        cliente_telefone: dto.cliente_telefone,
        endereco_origem: dto.endereco_origem,
        endereco_destino: dto.endereco_destino,
        observacoes: dto.observacoes,
      },
      include: { motoboy: { include: { usuario: { select: { nome: true } } } } },
    });

    return this.transformar(entrega);
  }

  async cancelar(id: string) {
    const e = await this.prisma.entrega.findUnique({ where: { id } });
    if (!e) throw new NotFoundException('Entrega não encontrada.');

    const atualizada = await this.prisma.entrega.update({
      where: { id },
      data: { status: 'cancelada' },
      include: { motoboy: { include: { usuario: { select: { nome: true } } } } },
    });
    return this.transformar(atualizada);
  }
}
