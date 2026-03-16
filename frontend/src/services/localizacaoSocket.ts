import { io, Socket } from 'socket.io-client';

const BASE_URL = 'http://localhost:3000';

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

// Gestor começa a assistir um motoboy específico
export function assistirMotoboy(
  motoboyId: string,
  onLocalizacao: (payload: LocalizacaoPayload) => void,
) {
  const s = conectar();

  s.emit('assistir', { motoboyId });
  s.on('localizacao_atualizada', onLocalizacao);

  return () => {
    s.emit('parar_assistir', { motoboyId });
    s.off('localizacao_atualizada', onLocalizacao);
  };
}

export function desconectar() {
  socket?.disconnect();
  socket = null;
}
