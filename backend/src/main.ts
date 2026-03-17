import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ExcecaoFilter } from './common/filters/excecao.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Logger Pino
  app.useLogger(app.get(Logger));

  // Headers de segurança HTTP
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https://*.tile.openstreetmap.org'],
        mediaSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'wss:', 'ws:'],
        fontSrc: ["'self'", 'https:', 'data:'],
      },
    },
  }));

  // Prefixo global da API
  app.setGlobalPrefix('api');

  // CORS — apenas origens permitidas
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });

  // Filtro global de exceções — mensagens em português
  app.useGlobalFilters(new ExcecaoFilter());

  // Validação automática de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (erros) => {
        const mensagens = erros.map((e) => {
          const campo = e.property;
          const restricoes = Object.values(e.constraints ?? {});
          // Traduz mensagens técnicas do class-validator
          const traduzidas = restricoes.map((r) => {
            if (r.includes('should not exist')) return `Campo '${campo}' não é permitido`;
            if (r.includes('must be a string')) return `'${campo}' deve ser um texto`;
            if (r.includes('must be an email')) return `'${campo}' deve ser um e-mail válido`;
            if (r.includes('must be a UUID')) return `'${campo}' deve ser um ID válido`;
            if (r.includes('must be longer than or equal')) return `'${campo}' muito curto`;
            if (r.includes('must be shorter than or equal')) return `'${campo}' muito longo`;
            if (r.includes('should not be empty')) return `'${campo}' é obrigatório`;
            if (r.includes('must be a number')) return `'${campo}' deve ser um número`;
            return r;
          });
          return traduzidas.join(', ');
        });
        return new BadRequestException(mensagens);
      },
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
