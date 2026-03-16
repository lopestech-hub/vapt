export const cores = {
  fundo: '#0F172A',
  superficie: '#1E293B',
  borda: '#334155',
  texto: '#F8FAFC',
  textoSecundario: '#94A3B8',
  textoMudo: '#475569',
  acento: '#F97316',
  sucesso: '#22C55E',
  aviso: '#EAB308',
  erro: '#EF4444',
  info: '#3B82F6',
};

export const espacamento = { xs: 4, sm: 8, md: 12, base: 16, lg: 24, xl: 32, xxl: 48 };
export const raio = { sm: 6, md: 10, lg: 16, full: 999 };
export const fonte = {
  tamanhos: { xs: 12, sm: 14, base: 16, lg: 18, xl: 24, xxl: 32 },
  pesos: { regular: '400' as const, medio: '500' as const, semibold: '600' as const, bold: '700' as const },
};

export function corStatus(status: string) {
  switch (status) {
    case 'em_rota':   return { cor: cores.info,    fundo: '#3B82F619' };
    case 'concluida': return { cor: cores.sucesso,  fundo: '#22C55E19' };
    case 'cancelada': return { cor: cores.erro,     fundo: '#EF444419' };
    default:          return { cor: cores.aviso,    fundo: '#EAB30819' };
  }
}

export function labelStatus(status: string) {
  const labels: Record<string, string> = {
    pendente: 'Pendente', em_rota: 'Em rota', concluida: 'Concluída', cancelada: 'Cancelada',
  };
  return labels[status] ?? status;
}
