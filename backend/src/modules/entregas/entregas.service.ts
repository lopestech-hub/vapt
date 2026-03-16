import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { MinioService } from '../../config/minio/minio.service';

@Injectable()
export class EntregasService {
  constructor(
    private prisma: PrismaService,
    private minio: MinioService,
  ) {}

  // Busca o motoboy vinculado ao usuário autenticado
  private async buscarMotoboy(usuarioId: string) {
    const motoboy = await this.prisma.motoboy.findUnique({
      where: { usuario_id: usuarioId },
    });
    if (!motoboy) throw new ForbiddenException('Motoboy não encontrado para este usuário.');
    return motoboy;
  }

  // Mapeia campos do schema para os nomes esperados pelo app mobile
  // Fórmula de Haversine — distância em linha reta entre dois pontos GPS
  private calcularDistanciaKm(
    lat1: number, lng1: number,
    lat2: number, lng2: number,
  ): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private transformar(entrega: any) {
    return {
      id: entrega.id,
      destinatario: entrega.cliente_nome,
      endereco_entrega: entrega.endereco_destino,
      descricao: entrega.observacoes ?? null,
      status: entrega.status,
      foto_url: entrega.comprovante_url ?? null,
      latitude: entrega.lat_entrega ? Number(entrega.lat_entrega) : null,
      longitude: entrega.lng_entrega ? Number(entrega.lng_entrega) : null,
      distancia_km: entrega.distancia_km ? Number(entrega.distancia_km) : null,
      iniciada_em: entrega.iniciada_em,
      concluida_em: entrega.concluida_em,
      criado_em: entrega.criado_em,
    };
  }

  async minhasEntregas(usuarioId: string) {
    const motoboy = await this.buscarMotoboy(usuarioId);
    const entregas = await this.prisma.entrega.findMany({
      where: { motoboy_id: motoboy.id },
      orderBy: [{ status: 'asc' }, { criado_em: 'desc' }],
    });
    return entregas.map((e) => this.transformar(e));
  }

  async buscarPorId(id: string, usuarioId: string) {
    const motoboy = await this.buscarMotoboy(usuarioId);
    const entrega = await this.prisma.entrega.findUnique({ where: { id } });
    if (!entrega) throw new NotFoundException('Entrega não encontrada.');
    if (entrega.motoboy_id !== motoboy.id) throw new ForbiddenException('Acesso negado.');
    return this.transformar(entrega);
  }

  async iniciar(id: string, usuarioId: string, latitude: number, longitude: number) {
    const motoboy = await this.buscarMotoboy(usuarioId);
    const entrega = await this.prisma.entrega.findUnique({ where: { id } });
    if (!entrega) throw new NotFoundException('Entrega não encontrada.');
    if (entrega.motoboy_id !== motoboy.id) throw new ForbiddenException('Acesso negado.');
    if (entrega.status !== 'pendente') {
      throw new BadRequestException('Apenas entregas com status "pendente" podem ser iniciadas.');
    }

    const atualizada = await this.prisma.entrega.update({
      where: { id },
      data: {
        status: 'em_rota',
        iniciada_em: new Date(),
        lat_inicio: latitude,
        lng_inicio: longitude,
      },
    });
    return this.transformar(atualizada);
  }

  async concluir(
    id: string,
    usuarioId: string,
    foto: Express.Multer.File | undefined,
    latitude: number,
    longitude: number,
  ) {
    const motoboy = await this.buscarMotoboy(usuarioId);
    const entrega = await this.prisma.entrega.findUnique({ where: { id } });
    if (!entrega) throw new NotFoundException('Entrega não encontrada.');
    if (entrega.motoboy_id !== motoboy.id) throw new ForbiddenException('Acesso negado.');
    if (entrega.status !== 'em_rota') {
      throw new BadRequestException('Apenas entregas com status "em_rota" podem ser concluídas.');
    }

    // Faz upload da foto se disponível; segue sem ela se MinIO estiver fora
    let comprovante_url: string | null = null;
    if (foto?.buffer) {
      comprovante_url = await this.minio.uploadFoto(foto.buffer);
    }

    // Calcula distância em linha reta se tiver GPS de início
    let distancia_km: number | null = null;
    if (entrega.lat_inicio && entrega.lng_inicio) {
      distancia_km = this.calcularDistanciaKm(
        Number(entrega.lat_inicio), Number(entrega.lng_inicio),
        latitude, longitude,
      );
    }

    const atualizada = await this.prisma.entrega.update({
      where: { id },
      data: {
        status: 'concluida',
        concluida_em: new Date(),
        comprovante_url,
        lat_entrega: latitude,
        lng_entrega: longitude,
        distancia_km,
      },
    });
    return this.transformar(atualizada);
  }
}
