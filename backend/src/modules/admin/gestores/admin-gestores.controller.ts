import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UsuarioAtual } from '../../../common/decorators/usuario-atual.decorator';
import { AdminGestoresService, CriarGestorDto } from './admin-gestores.service';

@Controller('admin/gestores')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminGestoresController {
  constructor(private service: AdminGestoresService) {}

  @Get()
  listar(@UsuarioAtual('empresa_id') empresaId: string) {
    return this.service.listar(empresaId);
  }

  @Post()
  criar(@Body() dto: CriarGestorDto, @UsuarioAtual('empresa_id') empresaId: string) {
    return this.service.criar(dto, empresaId);
  }

  @Patch(':id/toggle-ativo')
  toggleAtivo(@Param('id') id: string, @UsuarioAtual('empresa_id') empresaId: string) {
    return this.service.toggleAtivo(id, empresaId);
  }
}
