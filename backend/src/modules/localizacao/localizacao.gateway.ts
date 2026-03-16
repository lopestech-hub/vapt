import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface PayloadLocalizacao {
  motoboyId: string;
  latitude: number;
  longitude: number;
  entregaId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/localizacao',
})
export class LocalizacaoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Mapa: motoboyId → última localização conhecida
  private ultimasLocalizacoes = new Map<string, { lat: number; lng: number; atualizadoEm: Date; entregaId?: string }>();

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  // Motoboy envia localização (chamado pelo app a cada 1 minuto)
  @SubscribeMessage('localizar')
  async receberLocalizacao(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: PayloadLocalizacao,
  ) {
    const { motoboyId, latitude, longitude, entregaId } = payload;

    // Salva última localização em memória
    this.ultimasLocalizacoes.set(motoboyId, {
      lat: latitude,
      lng: longitude,
      atualizadoEm: new Date(),
      entregaId,
    });

    // Emite para gestores que estão assistindo esse motoboy
    this.server.to(`watch:${motoboyId}`).emit('localizacao_atualizada', {
      motoboyId,
      latitude,
      longitude,
      entregaId,
      atualizadoEm: new Date(),
    });
  }

  // Gestor começa a assistir um motoboy específico
  @SubscribeMessage('assistir')
  async assistirMotoboy(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { motoboyId: string },
  ) {
    const { motoboyId } = payload;

    // Entra na sala desse motoboy
    await client.join(`watch:${motoboyId}`);

    // Envia a última localização conhecida imediatamente
    const ultima = this.ultimasLocalizacoes.get(motoboyId);
    if (ultima) {
      client.emit('localizacao_atualizada', {
        motoboyId,
        latitude: ultima.lat,
        longitude: ultima.lng,
        entregaId: ultima.entregaId,
        atualizadoEm: ultima.atualizadoEm,
      });
    }

    return { success: true, temLocalizacao: !!ultima };
  }

  // Gestor para de assistir
  @SubscribeMessage('parar_assistir')
  async pararAssistir(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { motoboyId: string },
  ) {
    await client.leave(`watch:${payload.motoboyId}`);
    return { success: true };
  }
}
