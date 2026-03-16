import { io, Socket } from 'socket.io-client';
import * as Location from 'expo-location';

const BASE_URL = 'http://192.168.12.192:3000';

let socket: Socket | null = null;
let intervalo: ReturnType<typeof setInterval> | null = null;

// Conecta e começa a enviar localização a cada 1 minuto
export async function iniciarEnvioLocalizacao(motoboyId: string, entregaId: string, token: string) {
  // Pede permissão de localização
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return;

  // Conecta ao WebSocket
  socket = io(`${BASE_URL}/localizacao`, {
    auth: { token },
    transports: ['websocket'],
  });

  const enviarLocalizacao = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      socket?.emit('localizar', {
        motoboyId,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        entregaId,
      });
    } catch {
      // Silencioso — não quebra o app se GPS falhar
    }
  };

  // Envia imediatamente ao conectar
  socket.on('connect', () => enviarLocalizacao());

  // Envia a cada 1 minuto
  intervalo = setInterval(enviarLocalizacao, 60 * 1000);
}

// Para o envio ao concluir a entrega
export function pararEnvioLocalizacao() {
  if (intervalo) {
    clearInterval(intervalo);
    intervalo = null;
  }
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
