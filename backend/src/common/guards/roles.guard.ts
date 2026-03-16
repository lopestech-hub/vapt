import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const perfisPermitidos = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!perfisPermitidos) return true;

    const { user } = context.switchToHttp().getRequest();

    // Admin tem acesso a tudo (exceto rotas exclusivas de motoboy)
    if (user.perfil === 'admin' && !perfisPermitidos.includes('motoboy')) return true;

    if (!perfisPermitidos.includes(user.perfil)) {
      throw new ForbiddenException('Acesso não autorizado para este perfil');
    }

    return true;
  }
}
