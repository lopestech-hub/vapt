import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, X, ToggleLeft, ToggleRight, Truck, Navigation } from 'lucide-react';
import { api } from '../services/api';
import { RastreamentoMotoboy } from '../components/RastreamentoMotoboy';

interface FormData {
  nome: string;
  email: string;
  senha: string;
  cnh: string;
  placa_moto: string;
  modelo_moto: string;
  telefone: string;
  filial_id?: string;
}

export function MotoboysPage() {
  const [modalAberto, setModalAberto] = useState(false);
  const [rastreando, setRastreando] = useState<{ id: string; nome: string } | null>(null);
  const qc = useQueryClient();

  const { data: motoboys = [], isLoading } = useQuery({
    queryKey: ['motoboys'],
    queryFn: () => api.get('/admin/motoboys').then((r) => r.data),
  });

  const { data: filiais = [] } = useQuery({
    queryKey: ['filiais'],
    queryFn: () => api.get('/admin/motoboys/filiais').then((r) => r.data),
  });

  const criarMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/admin/motoboys', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['motoboys'] });
      setModalAberto(false);
      reset();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/motoboys/${id}/toggle-ativo`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['motoboys'] }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const erroCriar = criarMutation.error as any;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Motoboys</h1>
          <p className="text-slate-400 text-sm mt-1">{motoboys.length} cadastrados</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer text-sm"
        >
          <Plus size={16} />
          Novo Motoboy
        </button>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : motoboys.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl flex flex-col items-center justify-center h-40 gap-2">
          <Truck size={32} className="text-slate-600" />
          <p className="text-slate-400 text-sm">Nenhum motoboy cadastrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {motoboys.map((m: any) => (
            <div
              key={m.id}
              className={`bg-slate-800 border rounded-xl p-5 flex flex-col gap-3 transition-opacity ${
                m.ativo ? 'border-slate-700' : 'border-slate-700 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400 font-bold">
                    {m.nome[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{m.nome}</p>
                    <p className="text-slate-400 text-xs">{m.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleMutation.mutate(m.id)}
                  className="text-slate-400 hover:text-orange-400 transition-colors cursor-pointer"
                  title={m.ativo ? 'Desativar' : 'Ativar'}
                >
                  {m.ativo ? <ToggleRight size={22} className="text-orange-400" /> : <ToggleLeft size={22} />}
                </button>
              </div>

              <div className="flex flex-col gap-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Truck size={12} />
                  <span>{m.modelo_moto} — {m.placa_moto}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">CNH:</span>
                  <span>{m.cnh}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Tel:</span>
                  <span>{m.telefone}</span>
                </div>
                {m.filial && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Filial:</span>
                    <span className="text-orange-400 font-semibold">{m.filial.codigo} — {m.filial.nome}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-700">
                <span className="text-xs text-slate-500">{m.total_entregas} entregas</span>
                <div className="flex items-center gap-2">
                  {m.ativo && (
                    <button
                      onClick={() => setRastreando({ id: m.motoboy_id ?? m.id, nome: m.nome })}
                      className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors cursor-pointer"
                      title="Rastrear em tempo real"
                    >
                      <Navigation size={12} />
                      Rastrear
                    </button>
                  )}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    m.ativo ? 'bg-green-600/15 text-green-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {m.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal rastreamento */}
      {rastreando && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <div>
                <h2 className="text-base font-bold text-white">{rastreando.nome}</h2>
                <p className="text-xs text-slate-400">Localização em tempo real</p>
              </div>
              <button
                onClick={() => setRastreando(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <RastreamentoMotoboy motoboyId={rastreando.id} nomeMotboy={rastreando.nome} />
            </div>
          </div>
        </div>
      )}

      {/* Modal novo motoboy */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">Novo Motoboy</h2>
              <button
                onClick={() => { setModalAberto(false); reset(); }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit((d) => criarMutation.mutate(d))} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Nome *</label>
                  <input
                    {...register('nome', { required: true })}
                    placeholder="Nome completo"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">E-mail *</label>
                  <input
                    {...register('email', { required: true })}
                    type="email"
                    placeholder="email@exemplo.com"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Senha *</label>
                  <input
                    {...register('senha', { required: true })}
                    type="password"
                    placeholder="Senha inicial"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">CNH *</label>
                  <input
                    {...register('cnh', { required: true })}
                    placeholder="Número da CNH"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Telefone *</label>
                  <input
                    {...register('telefone', { required: true })}
                    placeholder="(11) 99999-0000"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Placa *</label>
                  <input
                    {...register('placa_moto', { required: true })}
                    placeholder="ABC-1234"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Modelo da Moto *</label>
                  <input
                    {...register('modelo_moto', { required: true })}
                    placeholder="Ex: Honda CG 160"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Filial</label>
                  <select
                    {...register('filial_id')}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 text-sm"
                  >
                    <option value="">Sem filial</option>
                    {filiais.map((f: any) => (
                      <option key={f.id} value={f.id}>{f.codigo} — {f.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              {erroCriar && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {erroCriar?.response?.data?.message ?? 'Erro ao cadastrar motoboy.'}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setModalAberto(false); reset(); }}
                  className="flex-1 h-11 border border-slate-600 text-slate-300 hover:bg-slate-700 font-medium rounded-lg transition-colors cursor-pointer text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={criarMutation.isPending}
                  className="flex-1 h-11 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center text-sm"
                >
                  {criarMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Cadastrar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
