import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Building2, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '../services/api';

interface Filial {
  id: string;
  codigo: string;
  nome: string;
  ativo: boolean;
  _count: { motoboys: number };
}

interface FormData {
  codigo: string;
  nome: string;
}

export function FiliaisPage() {
  const [modalAberto, setModalAberto] = useState(false);
  const qc = useQueryClient();

  const { data: filiais = [], isLoading } = useQuery({
    queryKey: ['filiais-admin'],
    queryFn: () => api.get('/admin/filiais').then((r) => r.data),
  });

  const criarMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/admin/filiais', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['filiais-admin'] });
      setModalAberto(false);
      reset();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/filiais/${id}/toggle-ativo`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['filiais-admin'] }),
  });

  const { register, handleSubmit, reset } = useForm<FormData>();
  const erroCriar = criarMutation.error as any;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Filiais</h1>
          <p className="text-slate-400 text-sm mt-1">{filiais.length} cadastradas</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer text-sm"
        >
          <Plus size={16} />
          Nova Filial
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filiais.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
          <Building2 size={40} />
          <p>Nenhuma filial cadastrada</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filiais.map((f: Filial) => (
            <div
              key={f.id}
              className={`bg-slate-800 border rounded-xl px-5 py-4 flex items-center justify-between gap-4 ${
                f.ativo ? 'border-slate-700' : 'border-slate-700 opacity-60'
              }`}
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">{f.codigo}</span>
                  <span className="text-white font-semibold text-sm truncate">{f.nome}</span>
                </div>
                <span className="text-slate-400 text-xs">{f._count.motoboys} motoboy{f._count.motoboys !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  f.ativo ? 'bg-green-600/15 text-green-400' : 'bg-slate-700 text-slate-400'
                }`}>
                  {f.ativo ? 'Ativa' : 'Inativa'}
                </span>
                <button
                  onClick={() => toggleMutation.mutate(f.id)}
                  className="text-slate-400 hover:text-orange-400 transition-colors cursor-pointer"
                >
                  {f.ativo ? <ToggleRight size={24} className="text-orange-500" /> : <ToggleLeft size={24} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="text-white font-semibold">Nova Filial</h2>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-white cursor-pointer text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit((d) => criarMutation.mutate(d))} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Código *</label>
                <input
                  {...register('codigo', { required: true })}
                  placeholder="Ex: 01, SP-CENTRO"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Nome *</label>
                <input
                  {...register('nome', { required: true })}
                  placeholder="Ex: Filial São Paulo Centro"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
                />
              </div>

              {erroCriar && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {erroCriar?.response?.data?.message ?? 'Erro ao criar filial.'}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalAberto(false)}
                  className="flex-1 h-11 border border-slate-600 text-slate-300 hover:bg-slate-700 font-medium rounded-lg transition-colors cursor-pointer text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={criarMutation.isPending}
                  className="flex-1 h-11 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center text-sm">
                  {criarMutation.isPending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
