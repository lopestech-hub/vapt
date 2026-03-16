import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from './api';

// Configuração global: como mostrar notificações com app em foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registrarPushToken(): Promise<void> {
  // Push não funciona em emuladores
  if (!Device.isDevice) return;

  // Canal Android (obrigatório para Android 8+)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Padrão',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6900',
    });
  }

  const { status: statusAtual } = await Notifications.getPermissionsAsync();
  let statusFinal = statusAtual;

  if (statusAtual !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    statusFinal = status;
  }

  // Usuário negou permissão — segue sem notificações
  if (statusFinal !== 'granted') return;

  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId: '56ad79aa-69bb-47ae-a012-9f7f877a759a',
  });

  // Salva o token no backend (melhor-esforço, não bloqueia o login)
  try {
    await api.patch('/entregas/push-token', { token });
  } catch {
    // Falha silenciosa
  }
}
