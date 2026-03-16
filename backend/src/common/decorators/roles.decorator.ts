import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Uso: @Roles('gestor') ou @Roles('motoboy') ou @Roles('gestor', 'motoboy')
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
