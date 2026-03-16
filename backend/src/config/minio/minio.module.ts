import { Global, Module } from '@nestjs/common';
import { MinioService } from './minio.service';

// Global para estar disponível em todos os módulos
@Global()
@Module({
  providers: [MinioService],
  exports: [MinioService],
})
export class MinioModule {}
