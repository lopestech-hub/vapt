import { Module } from '@nestjs/common';
import { LocalizacaoGateway } from './localizacao.gateway';

@Module({
  providers: [LocalizacaoGateway],
  exports: [LocalizacaoGateway],
})
export class LocalizacaoModule {}
