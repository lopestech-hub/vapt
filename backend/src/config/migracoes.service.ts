import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class MigracoesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MigracoesService.name);

  constructor(private prisma: PrismaService) {}

  async onApplicationBootstrap() {
    await this.executar();
  }

  private async executar() {
    try {
      // Adiciona push_token ao Motoboy caso ainda não exista
      await this.prisma.$executeRawUnsafe(
        `ALTER TABLE "Motoboy" ADD COLUMN IF NOT EXISTS "push_token" TEXT;`,
      );
      this.logger.log('Migrações executadas com sucesso');
    } catch (err) {
      this.logger.error({ err }, 'Erro ao executar migrações de startup');
    }
  }
}
