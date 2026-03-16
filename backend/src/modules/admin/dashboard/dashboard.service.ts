import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import { startOfDay, endOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const agora = toZonedTime(new Date(), 'America/Sao_Paulo');
    const inicioDia = startOfDay(agora);
    const fimDia = endOfDay(agora);

    const [
      totalMotoboys,
      motoboysTrabalhando,
      entregasHoje,
      entregasPendentes,
      entregasEmRota,
      entregasConcluidasHoje,
      totalEntregas,
    ] = await Promise.all([
      this.prisma.motoboy.count(),
      this.prisma.entrega.groupBy({
        by: ['motoboy_id'],
        where: { status: 'em_rota' },
      }).then((r) => r.length),
      this.prisma.entrega.count({
        where: { criado_em: { gte: inicioDia, lte: fimDia } },
      }),
      this.prisma.entrega.count({ where: { status: 'pendente' } }),
      this.prisma.entrega.count({ where: { status: 'em_rota' } }),
      this.prisma.entrega.count({
        where: { status: 'concluida', concluida_em: { gte: inicioDia, lte: fimDia } },
      }),
      this.prisma.entrega.count(),
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
