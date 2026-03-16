import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsuarioAtual } from '../../common/decorators/usuario-atual.decorator';
import { EntregasService } from './entregas.service';

@Controller('entregas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('motoboy')
export class EntregasController {
  constructor(private service: EntregasService) {}

  // Salva o push token do dispositivo para notificações
  @Patch('push-token')
  salvarPushToken(
    @UsuarioAtual('id') usuarioId: string,
    @Body('token') token: string,
  ) {
    return this.service.salvarPushToken(usuarioId, token);
  }

  // Lista todas as entregas do motoboy autenticado
  @Get('minhas')
  minhas(@UsuarioAtual('id') id: string) {
    return this.service.minhasEntregas(id);
  }

  // Detalhe de uma entrega específica
  @Get(':id')
  buscar(@Param('id') id: string, @UsuarioAtual('id') usuarioId: string) {
    return this.service.buscarPorId(id, usuarioId);
  }

  // Inicia uma entrega: pendente → em_rota (com GPS de partida)
  @Put(':id/iniciar')
  iniciar(
    @Param('id') id: string,
    @UsuarioAtual('id') usuarioId: string,
    @Body('latitude') latitude: string,
    @Body('longitude') longitude: string,
  ) {
    return this.service.iniciar(id, usuarioId, parseFloat(latitude), parseFloat(longitude));
  }

  // Conclui com foto + GPS: em_rota → concluida
  @Post(':id/concluir')
  @UseInterceptors(FileInterceptor('foto', { storage: memoryStorage() }))
  concluir(
    @Param('id') id: string,
    @UsuarioAtual('id') usuarioId: string,
    @UploadedFile() foto: Express.Multer.File,
    @Body('latitude') latitude: string,
    @Body('longitude') longitude: string,
  ) {
    return this.service.concluir(
      id,
      usuarioId,
      foto,
      parseFloat(latitude),
      parseFloat(longitude),
    );
  }
}
