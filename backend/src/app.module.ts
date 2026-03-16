import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './config/prisma.module';
import { MinioModule } from './config/minio/minio.module';
import { AuthModule } from './modules/auth/auth.module';
import { EntregasModule } from './modules/entregas/entregas.module';
import { AdminModule } from './modules/admin/admin.module';
import { LocalizacaoModule } from './modules/localizacao/localizacao.module';

@Module({
  imports: [
    // Carrega variáveis de ambiente
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting: máximo 60 requisições por minuto por IP
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),

    // Logs estruturados com Pino
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
        // Nunca logar senhas ou tokens nos logs de requisição
        redact: ['req.headers.authorization', 'req.body.senha', 'req.body.refresh_token'],
      },
    }),

    // Banco de dados (global)
    PrismaModule,

    // Módulos da aplicação
    MinioModule,
    AuthModule,
    EntregasModule,
    AdminModule,
    LocalizacaoModule,
  ],
})
export class AppModule {}
