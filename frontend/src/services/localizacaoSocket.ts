import { io, Socket } from 'socket.io-client';

// Usa origem atual — funciona em dev (via proxy Vite) e em produção
const BASE_URL = window.location.origin;

let socket: Socket | null = null;

function conectar(): Socket {
  if (socket?.connected) return socket;

  socket = io(`${BASE_URL}/localizacao`, {
    transports: ['websocket'],
    autoConnect: true,
  });

  return socket;
}

export interface LocalizacaoPayload {
  motoboyId: string;
  latitude: number;
  longitude: number;
  entregaId?: string;
  atualizadoEm: Date;
}

export interface PontoRota {
  lat: number;
  lng: number;
  atualizadoEm: Date;
}

export interface HistoricoRota {
  motoboyId: string;
  pontos: PontoRota[];
  entregaId?: string;
}

// Gestor começa a assistir um motoboy específico
export function assistirMotoboy(
  motoboyId: string,
  onLocalizacao: (payload: LocalizacaoPayload) => void,
  onHistorico?: (historico: HistoricoRota) => void,
) {
  const s = conectar();

  s.emit('assistir', { motoboyId });
  s.on('localizacao_atualizada', onLocalizacao);
  if (onHistorico) s.on('historico_rota', onHistorico);

  return () => {
    s.emit('parar_assistir', { motoboyId });
    s.off('localizacao_atualizada', onLocalizacao);
    if (onHistorico) s.off('historico_rota', onHistorico);
  };
}

export function desconectar() {
  socket?.disconnect();
  socket = null;
}
