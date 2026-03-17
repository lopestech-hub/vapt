import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// Tradução de mensagens técnicas para português
const traducoes: Record<string, string> = {
  'Unauthorized': 'Não autorizado. Faça login novamente.',
  'Forbidden': 'Acesso não permitido para este perfil.',
  'Not Found': 'Recurso não encontrado.',
  'Bad Request': 'Dados inválidos na requisição.',
  'Conflict': 'Registro já existe.',
  'Internal Server Error': 'Erro interno do servidor.',
  'Unprocessable Entity': 'Dados não processáveis.',
  'Too Many Requests': 'Muitas tentativas. Aguarde um momento.',
  'Service Unavailable': 'Serviço temporariamente indisponível.',
  'property should not exist': 'Campo não permitido',
  'Acesso não autorizado para este perfil': 'Acesso não permitido para este perfil.',
};

function traduzir(msg: string): string {
  // Verifica chave exata
  if (traducoes[msg]) return traducoes[msg];
  // Verifica se começa com alguma chave conhecida
  for (const chave of Object.keys(traducoes)) {
    if (msg.toLowerCase().includes(chave.toLowerCase())) return traducoes[chave];
  }
  return msg;
}

function traduzirMensagens(mensagem: string | string[] | Record<string, any>): string | string[] {
  if (Array.isArray(mensagem)) return mensagem.map(traduzir);
  if (typeof mensagem === 'string') return traduzir(mensagem);
  return 'Erro na requisição';
}

@Catch(HttpException)
export class ExcecaoFilter implements ExceptionFilter {
  private readonly logger = new Logger(ExcecaoFilter.name);

  catch(excecao: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const resposta = ctx.getResponse<Response>();
    const requisicao = ctx.getRequest<Request>();
    const status = excecao.getStatus();
    const corpo = excecao.getResponse() as any;

    const mensagem =
      typeof corpo === 'object' && corpo.message
        ? traduzirMensagens(corpo.message)
        : traduzir(typeof corpo === 'string' ? corpo : 'Erro inesperado');

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        { url: requisicao.url, status, mensagem },
        'Erro interno',
      );
    }

    resposta.status(status).json({
      statusCode: status,
      message: mensagem,
      error: traduzir(corpo?.error ?? HttpStatus[status] ?? 'Erro'),
    });
  }
}
