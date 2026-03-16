import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UsuarioAtual } from '../../../common/decorators/usuario-atual.decorator';
import { DashboardService } from './dashboard.service';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('gestor')
export class DashboardController {
  constructor(private service: DashboardService) {}

  @Get()
  stats(@UsuarioAtual('empresa_id') empresaId: string) {
    return this.service.getStats(empresaId);
  }
}
