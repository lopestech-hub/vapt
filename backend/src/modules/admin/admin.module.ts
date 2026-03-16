import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { AdminMotoboysController } from './motoboys/admin-motoboys.controller';
import { AdminMotoboysService } from './motoboys/admin-motoboys.service';
import { AdminEntregasController } from './entregas/admin-entregas.controller';
import { AdminEntregasService } from './entregas/admin-entregas.service';

@Module({
  controllers: [DashboardController, AdminMotoboysController, AdminEntregasController],
  providers: [DashboardService, AdminMotoboysService, AdminEntregasService],
})
export class AdminModule {}
