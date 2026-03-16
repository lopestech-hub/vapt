import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../services/api';

const STATUS_LABELS: Record<string, { label: string; classe: string }> = {
  pendente:  { label: 'Pendente',  classe: 'bg-yellow-500/15 text-yellow-400' },
  em_rota:   { label: 'Em Rota',   classe: 'bg-blue-500/15 text-blue-400' },
  concluida: { label: 'Concluída', classe: 'bg-green-600/15 text-green-400' },
  cancelada: { label: 'Cancelada', classe: 'bg-red-500/15 text-red-400' },
};

export function EntregasPage() {
  const [filtroStatus, setFiltroStatus] = useState('');
  const [busca, setBusca] = useState('');
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: entregas = [], isLoading } = useQuery({
    queryKey: ['entregas', filtroStatus],
    queryFn: () =>
      api.get('/admin/entregas', { params: filtroStatus ? { status: filtroStatus } : {} })
         .then((r) => r.data),
  });

  const cancelarMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/entregas/${id}/cancelar`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entregas'] }),
  });

  const filtradas = entregas.filter((e: any) =>
    e.cliente_nome.toLowerCase().includes(busca.toLowerCase()) ||
    e.endereco_destino.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Entregas</h1>
          <p className="text-slate-400 text-sm mt-1">{entregas.length} registros</p>
        </div>
        <button
          onClick={() => navigate('/entregas/nova')}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer text-sm"
        >
          <Plus size={16} />
          Nova Entrega
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por cliente ou endereço..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
        >
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="em_rota">Em Rota</option>
          <option value="concluida">Concluída</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <p className="text-slate-400 text-sm">Nenhuma entrega encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">Cliente</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3 hidden md:table-cell">Destino</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3 hidden lg:table-cell">Motoboy</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3 hidden sm:table-cell">Data</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtradas.map((e: any) => {
                  const st = STATUS_LABELS[e.status] ?? { label: e.status, classe: '' };
                  return (
                    <tr key={e.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-4 text-sm text-white font-medium">{e.cliente_nome}</td>
                      <td className="px-5 py-4 text-sm text-slate-400 hidden md:table-cell max-w-xs truncate">{e.endereco_destino}</td>
                      <td className="px-5 py-4 text-sm text-slate-400 hidden lg:table-cell">{e.motoboy?.nome ?? '-'}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.classe}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500 hidden sm:table-cell">
                        {format(new Date(e.criado_em), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => navigate(`/entregas/${e.id}`)}
                            className="text-slate-400 hover:text-orange-400 transition-colors cursor-pointer"
                            title="Ver detalhes"
                          >
                            <Eye size={16} />
                          </button>
                          {e.status === 'pendente' && (
                            <button
                              onClick={() => cancelarMutation.mutate(e.id)}
                              className="text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                              title="Cancelar"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
