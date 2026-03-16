import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificacoesService {
  private readonly logger = new Logger(NotificacoesService.name);

  async enviarParaMotoboy(pushToken: string | null, titulo: string, corpo: string): Promise<void> {
    if (!pushToken || !pushToken.startsWith('ExponentPushToken')) return;

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ to: pushToken, title: titulo, body: corpo, sound: 'default' }),
      });
      const resultado = await response.json() as any;
      if (resultado?.data?.status === 'error') {
        this.logger.warn({ resultado }, 'Notificação rejeitada pela Expo');
      }
    } catch (err) {
      // Falha silenciosa — notificação é melhor-esforço
      this.logger.error({ err }, 'Erro ao enviar notificação push');
    }
  }
}
