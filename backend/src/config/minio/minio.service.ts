import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { Readable } from 'stream';
import { randomUUID } from 'crypto';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: Client;
  private bucket: string;
  private disponivel = false;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    this.bucket = this.config.get('MINIO_BUCKET', 'mototrack');

    try {
      this.client = new Client({
        endPoint: this.config.get('MINIO_ENDPOINT', 'localhost'),
        port: parseInt(this.config.get('MINIO_PORT', '9000')),
        useSSL: this.config.get('MINIO_USE_SSL', 'false') === 'true',
        accessKey: this.config.get('MINIO_ACCESS_KEY', 'minioadmin'),
        secretKey: this.config.get('MINIO_SECRET_KEY', 'minioadmin'),
      });

      const existe = await this.client.bucketExists(this.bucket);
      if (!existe) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Bucket '${this.bucket}' criado`);
      }

      this.disponivel = true;
      this.logger.log('MinIO conectado com sucesso');
    } catch (err: any) {
      this.logger.warn(`MinIO indisponível: ${err.message}. Fotos serão ignoradas.`);
    }
  }

  // Retorna URL presignada válida por 1 ano, ou null se MinIO indisponível
  async uploadFoto(buffer: Buffer): Promise<string | null> {
    if (!this.disponivel) return null;

    try {
      const chave = `entregas/${randomUUID()}.jpg`;
      const stream = Readable.from(buffer);
      await this.client.putObject(this.bucket, chave, stream, buffer.length, {
        'Content-Type': 'image/jpeg',
      });
      const url = await this.client.presignedGetObject(this.bucket, chave, 365 * 24 * 60 * 60);
      return url;
    } catch (err: any) {
      this.logger.error(`Falha no upload da foto: ${err.message}`);
      return null;
    }
  }
}
