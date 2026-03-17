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

interface PontoRota {
  lat: number;
  lng: number;
  atualizadoEm: Date;
}

interface DadosMotoboy {
  pontos: PontoRota[];
  entregaId?: string;
}

// Máximo de pontos de rota armazenados por motoboy (≈ 3h com envio a cada 1min)
const MAX_PONTOS = 200;

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

  // Mapa: motoboyId → histórico de rota
  private rotas = new Map<string, DadosMotoboy>();

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
    const agora = new Date();

    // Adiciona ponto ao histórico de rota
    const dados = this.rotas.get(motoboyId) ?? { pontos: [], entregaId };
    dados.pontos.push({ lat: latitude, lng: longitude, atualizadoEm: agora });
    if (dados.pontos.length > MAX_PONTOS) dados.pontos.shift();
    if (entregaId) dados.entregaId = entregaId;
    this.rotas.set(motoboyId, dados);

    // Emite o novo ponto para gestores que estão assistindo
    this.server.to(`watch:${motoboyId}`).emit('localizacao_atualizada', {
      motoboyId,
      latitude,
      longitude,
      entregaId,
      atualizadoEm: agora,
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

    const dados = this.rotas.get(motoboyId);

    // Envia o histórico completo de rota imediatamente
    if (dados && dados.pontos.length > 0) {
      client.emit('historico_rota', {
        motoboyId,
        pontos: dados.pontos,
        entregaId: dados.entregaId,
      });
    }

    return { success: true, temLocalizacao: !!dados && dados.pontos.length > 0 };
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
