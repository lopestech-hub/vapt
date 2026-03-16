import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Logger Pino
  app.useLogger(app.get(Logger));

  // Headers de segurança HTTP
  app.use(helmet());

  // Prefixo global da API
  app.setGlobalPrefix('api');

  // CORS — apenas origens permitidas
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });

  // Validação automática de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // remove campos não declarados no DTO
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Servir o frontend buildado como arquivos estáticos em produção
  // __dirname = /app/dist/src → public está em /app/public (dois níveis acima)
  if (process.env.NODE_ENV === 'production') {
    app.useStaticAssets(join(__dirname, '..', '..', 'public'));
    app.setBaseViewsDir(join(__dirname, '..', '..', 'public'));
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`MotoTrack rodando na porta ${port} 🚀`);
}
bootstrap();
