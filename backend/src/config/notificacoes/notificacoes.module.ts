import { Global, Module } from '@nestjs/common';
import { NotificacoesService } from './notificacoes.service';

// Global — disponível em todos os módulos sem precisar importar
@Global()
@Module({
  providers: [NotificacoesService],
  exports: [NotificacoesService],
})
export class NotificacoesModule {}
