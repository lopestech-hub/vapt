import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import { startOfDay, endOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(empresaId: string) {
    const agora = toZonedTime(new Date(), 'America/Sao_Paulo');
    const inicioDia = startOfDay(agora);
    const fimDia = endOfDay(agora);

    const motoboys = await this.prisma.motoboy.findMany({
      where: { usuario: { empresa_id: empresaId } },
      select: { id: true },
    });
    const motoboyIds = motoboys.map((m) => m.id);

    const [
      totalMotoboys,
      motoboysTrabalhando,
      entregasHoje,
      entregasPendentes,
      entregasEmRota,
      entregasConcluidasHoje,
      totalEntregas,
    ] = await Promise.all([
      this.prisma.motoboy.count({ where: { usuario: { empresa_id: empresaId } } }),
      this.prisma.entrega.groupBy({
        by: ['motoboy_id'],
        where: { status: 'em_rota', motoboy_id: { in: motoboyIds } },
      }).then((r) => r.length),
      this.prisma.entrega.count({
        where: { motoboy_id: { in: motoboyIds }, criado_em: { gte: inicioDia, lte: fimDia } },
      }),
      this.prisma.entrega.count({ where: { status: 'pendente', motoboy_id: { in: motoboyIds } } }),
      this.prisma.entrega.count({ where: { status: 'em_rota', motoboy_id: { in: motoboyIds } } }),
      this.prisma.entrega.count({
        where: { status: 'concluida', motoboy_id: { in: motoboyIds }, concluida_em: { gte: inicioDia, lte: fimDia } },
      }),
      this.prisma.entrega.count({ where: { motoboy_id: { in: motoboyIds } } }),
    ]);

    return {
      totalMotoboys,
      motoboysTrabalhando,
      entregasHoje,
      entregasPendentes,
      entregasEmRota,
      entregasConcluidasHoje,
      totalEntregas,
    };
  }
}
