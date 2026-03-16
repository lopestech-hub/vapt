import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AdminEntregasService, CriarEntregaDto } from './admin-entregas.service';

@Controller('admin/entregas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('gestor')
export class AdminEntregasController {
  constructor(private service: AdminEntregasService) {}

  @Get()
  listar(@Query('status') status?: string) {
    return this.service.listar(status);
  }

  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.service.buscarPorId(id);
  }

  @Post()
  criar(@Body() dto: CriarEntregaDto) {
    return this.service.criar(dto);
  }

  @Patch(':id/cancelar')
  cancelar(@Param('id') id: string) {
    return this.service.cancelar(id);
  }
}
