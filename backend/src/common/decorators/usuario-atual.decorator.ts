import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Extrai o usuário autenticado da requisição
// Uso: @UsuarioAtual() usuario: Usuario
export const UsuarioAtual = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
