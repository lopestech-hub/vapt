import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from './prisma.service';

@Injectable()
export class MigracoesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MigracoesService.name);

  constructor(private prisma: PrismaService) {}

  async onApplicationBootstrap() {
    await this.criarEstrutura();
    await this.seedInicial();
  }

  // Cria tabelas e colunas novas de forma idempotente
  private async criarEstrutura() {
    try {
      // Adiciona valor 'admin' ao enum (deve rodar fora de transação no PostgreSQL)
      await this.prisma.$executeRawUnsafe(
        `ALTER TYPE "PerfilUsuario" ADD VALUE IF NOT EXISTS 'admin';`,
      );

      // Cria tabela Empresa
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Empresa" (
          "id"        TEXT NOT NULL,
          "nome"      TEXT NOT NULL,
          "cnpj"      TEXT,
          "ativo"     BOOLEAN NOT NULL DEFAULT true,
          "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
        );
      `);

      // Adiciona empresa_id em Usuario
      await this.prisma.$executeRawUnsafe(
        `ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "empresa_id" TEXT;`,
      );

      // Adiciona empresa_id em Filial
      await this.prisma.$executeRawUnsafe(
        `ALTER TABLE "Filial" ADD COLUMN IF NOT EXISTS "empresa_id" TEXT;`,
      );

      // Adiciona push_token em Motoboy (caso não exista)
      await this.prisma.$executeRawUnsafe(
        `ALTER TABLE "Motoboy" ADD COLUMN IF NOT EXISTS "push_token" TEXT;`,
      );

      // FK Usuario → Empresa
      await this.prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'Usuario_empresa_id_fkey'
          ) THEN
            ALTER TABLE "Usuario"
              ADD CONSTRAINT "Usuario_empresa_id_fkey"
              FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id")
              ON DELETE SET NULL ON UPDATE CASCADE;
          END IF;
        END $$;
      `);

      // FK Filial → Empresa
      await this.prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'Filial_empresa_id_fkey'
          ) THEN
            ALTER TABLE "Filial"
              ADD CONSTRAINT "Filial_empresa_id_fkey"
              FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id")
              ON DELETE SET NULL ON UPDATE CASCADE;
          END IF;
        END $$;
      `);

      // Índices
      await this.prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "Usuario_empresa_id_idx" ON "Usuario"("empresa_id");`,
      );
      await this.prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "Filial_empresa_id_idx" ON "Filial"("empresa_id");`,
      );

      this.logger.log('Estrutura do banco atualizada com sucesso');
    } catch (err) {
      this.logger.error({ err }, 'Erro ao criar estrutura do banco');
    }
  }

  // Seed inicial: só executa se não existir nenhuma empresa
  private async seedInicial() {
    try {
      const resultado = await this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count FROM "Empresa"
      `;
      const total = Number(resultado[0].count);

      if (total > 0) {
        this.logger.log('Seed ignorado — empresa já existe');
        return;
      }

      this.logger.log('Nenhuma empresa encontrada — executando reset e seed inicial...');

      // Limpa todos os dados existentes na ordem correta (FK)
      await this.prisma.$executeRawUnsafe(`
        TRUNCATE TABLE
          "Abastecimento",
          "Manutencao",
          "Entrega",
          "Motoboy",
          "Filial",
          "Usuario"
        RESTART IDENTITY CASCADE;
      `);

      // Cria a empresa
      const empresaId = randomUUID();
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO "Empresa" ("id", "nome", "ativo", "criado_em")
         VALUES ($1, $2, true, NOW())`,
        empresaId,
        'Bezerra Auto Peças',
      );

      // Cria o admin
      const senhaHash = await bcrypt.hash('2570', 10);
      const usuarioId = randomUUID();
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO "Usuario"
           ("id", "empresa_id", "nome", "email", "senha_hash", "perfil", "ativo", "criado_em", "atualizado_em")
         VALUES ($1, $2, $3, $4, $5, 'admin'::"PerfilUsuario", true, NOW(), NOW())`,
        usuarioId,
        empresaId,
        'Admin',
        'juliofranlopes18@gmail.com',
        senhaHash,
      );

      this.logger.log('Seed concluído — empresa "Bezerra Auto Peças" e admin criados');
    } catch (err) {
      this.logger.error({ err }, 'Erro ao executar seed inicial');
    }
  }
}
