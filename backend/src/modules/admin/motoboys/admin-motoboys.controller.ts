import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AdminMotoboysService, CriarMotoboyDto } from './admin-motoboys.service';

@Controller('admin/motoboys')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('gestor')
export class AdminMotoboysController {
  constructor(private service: AdminMotoboysService) {}

  @Get('filiais')
  listarFiliais() {
    return this.service.listarFiliais();
  }

  @Get()
  listar() {
    return this.service.listar();
  }

  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.service.buscarPorId(id);
  }

  @Post()
  criar(@Body() dto: CriarMotoboyDto) {
    return this.service.criar(dto);
  }

  @Patch(':id/toggle-ativo')
  toggleAtivo(@Param('id') id: string) {
    return this.service.toggleAtivo(id);
  }
}
