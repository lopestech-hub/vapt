import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UsuarioAtual } from '../../../common/decorators/usuario-atual.decorator';
import { AdminEntregasService, CriarEntregaDto } from './admin-entregas.service';

@Controller('admin/entregas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('gestor')
export class AdminEntregasController {
  constructor(private service: AdminEntregasService) {}

  @Get()
  listar(@UsuarioAtual('empresa_id') empresaId: string, @Query('status') status?: string) {
    return this.service.listar(empresaId, status);
  }

  @Get(':id')
  buscar(@Param('id') id: string, @UsuarioAtual('empresa_id') empresaId: string) {
    return this.service.buscarPorId(id, empresaId);
  }

  @Post()
  criar(@Body() dto: CriarEntregaDto, @UsuarioAtual('empresa_id') empresaId: string) {
    return this.service.criar(dto, empresaId);
  }

  @Patch(':id/cancelar')
  cancelar(@Param('id') id: string, @UsuarioAtual('empresa_id') empresaId: string) {
    return this.service.cancelar(id, empresaId);
  }
}
