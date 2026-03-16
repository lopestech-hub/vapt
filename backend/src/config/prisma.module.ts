import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Global para não precisar importar em cada módulo
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
