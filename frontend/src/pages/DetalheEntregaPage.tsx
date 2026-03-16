import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Clock, Ruler, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../services/api';

const STATUS_LABELS: Record<string, { label: string; classe: string }> = {
  pendente:  { label: 'Pendente',  classe: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20' },
  em_rota:   { label: 'Em Rota',   classe: 'bg-blue-500/15 text-blue-400 border border-blue-500/20' },
  concluida: { label: 'Concluída', classe: 'bg-green-600/15 text-green-400 border border-green-600/20' },
  cancelada: { label: 'Cancelada', classe: 'bg-red-500/15 text-red-400 border border-red-500/20' },
};

function InfoItem({ icon: Icon, label, valor }: { icon: React.ElementType; label: string; valor: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-slate-500"><Icon size={15} /></div>
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">{label}</p>
        <p className="text-sm text-white mt-0.5">{valor}</p>
      </div>
    </div>
  );
}

export function DetalheEntregaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: entrega, isLoading } = useQuery({
    queryKey: ['entrega', id],
    queryFn: () => api.get(`/admin/entregas/${id}`).then((r) => r.data),
  });

  const cancelarMutation = useMutation({
    mutationFn: () => api.patch(`/admin/entregas/${id}/cancelar`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entregas'] });
      qc.invalidateQueries({ queryKey: ['entrega', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!entrega) return null;

  const st = STATUS_LABELS[entrega.status] ?? { label: entrega.status, classe: '' };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Detalhes da Entrega</h1>
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${st.classe}`}>
          {st.label}
        </span>
      </div>

      {/* Card principal */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col gap-5">
        {/* Cliente */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Cliente</p>
          <p className="text-lg font-semibold text-white">{entrega.cliente_nome}</p>
          {entrega.cliente_telefone && (
            <p className="text-sm text-slate-400 mt-0.5">{entrega.cliente_telefone}</p>
          )}
        </div>

        <div className="h-px bg-slate-700" />

        {/* Endereços */}
        <div className="flex flex-col gap-3">
          <InfoItem icon={MapPin} label="Origem" valor={entrega.endereco_origem} />
          <InfoItem icon={MapPin} label="Destino" valor={entrega.endereco_destino} />
        </div>

        {entrega.observacoes && (
          <>
            <div className="h-px bg-slate-700" />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Observações</p>
              <p className="text-sm text-slate-300">{entrega.observacoes}</p>
            </div>
          </>
        )}

        <div className="h-px bg-slate-700" />

        {/* Motoboy */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Motoboy</p>
          {entrega.motoboy ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center text-sm font-bold text-orange-400">
                {entrega.motoboy.nome?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-white font-medium">{entrega.motoboy.nome}</p>
                <p className="text-xs text-slate-400">{entrega.motoboy.placa}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Não atribuído</p>
          )}
        </div>

        {/* Registro de tempo e distância */}
        {(entrega.iniciada_em || entrega.concluida_em || entrega.distancia_km) && (
          <>
            <div className="h-px bg-slate-700" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {entrega.iniciada_em && (
                <div className="bg-slate-900 rounded-lg p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock size={13} />
                    <span className="text-xs font-semibold uppercase tracking-wide">Iniciada</span>
                  </div>
                  <p className="text-sm text-white font-medium">
                    {format(new Date(entrega.iniciada_em), "dd/MM HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )}
              {entrega.concluida_em && (
                <div className="bg-slate-900 rounded-lg p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock size={13} />
                    <span className="text-xs font-semibold uppercase tracking-wide">Concluída</span>
                  </div>
                  <p className="text-sm text-white font-medium">
                    {format(new Date(entrega.concluida_em), "dd/MM HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )}
              {entrega.distancia_km && (
                <div className="bg-slate-900 rounded-lg p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Ruler size={13} />
                    <span className="text-xs font-semibold uppercase tracking-wide">Distância</span>
                  </div>
                  <p className="text-sm text-white font-medium">{entrega.distancia_km.toFixed(2)} km</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Foto de comprovante */}
        {entrega.comprovante_url && (
          <>
            <div className="h-px bg-slate-700" />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-3">Comprovante</p>
              <img
                src={entrega.comprovante_url}
                alt="Comprovante de entrega"
                className="w-full rounded-lg object-cover max-h-72"
              />
            </div>
          </>
        )}
      </div>

      {/* Ações */}
      {entrega.status === 'pendente' && (
        <button
          onClick={() => cancelarMutation.mutate()}
          disabled={cancelarMutation.isPending}
          className="flex items-center justify-center gap-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 font-medium px-4 py-3 rounded-xl transition-colors cursor-pointer text-sm disabled:opacity-60"
        >
          <XCircle size={16} />
          Cancelar Entrega
        </button>
      )}
    </div>
  );
}
