import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { AdminMotoboysController } from './motoboys/admin-motoboys.controller';
import { AdminMotoboysService } from './motoboys/admin-motoboys.service';
import { AdminEntregasController } from './entregas/admin-entregas.controller';
import { AdminEntregasService } from './entregas/admin-entregas.service';
import { AdminGestoresController } from './gestores/admin-gestores.controller';
import { AdminGestoresService } from './gestores/admin-gestores.service';
import { AdminFiliaisController } from './filiais/admin-filiais.controller';
import { AdminFiliaisService } from './filiais/admin-filiais.service';

@Module({
  controllers: [
    DashboardController,
    AdminMotoboysController,
    AdminEntregasController,
    AdminGestoresController,
    AdminFiliaisController,
  ],
  providers: [
    DashboardService,
    AdminMotoboysService,
    AdminEntregasService,
    AdminGestoresService,
    AdminFiliaisService,
  ],
})
export class AdminModule {}
