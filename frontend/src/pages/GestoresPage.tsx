import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, UserCog, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '../services/api';

interface Gestor {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  criado_em: string;
}

interface FormData {
  nome: string;
  email: string;
  senha: string;
}

export function GestoresPage() {
  const [modalAberto, setModalAberto] = useState(false);
  const qc = useQueryClient();

  const { data: gestores = [], isLoading } = useQuery({
    queryKey: ['gestores'],
    queryFn: () => api.get('/admin/gestores').then((r) => r.data),
  });

  const criarMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/admin/gestores', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gestores'] });
      setModalAberto(false);
      reset();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/gestores/${id}/toggle-ativo`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gestores'] }),
  });

  const { register, handleSubmit, reset } = useForm<FormData>();
  const erroCriar = criarMutation.error as any;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestores</h1>
          <p className="text-slate-400 text-sm mt-1">{gestores.length} cadastrados</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer text-sm"
        >
          <Plus size={16} />
          Novo Gestor
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : gestores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
          <UserCog size={40} />
          <p>Nenhum gestor cadastrado</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {gestores.map((g: Gestor) => (
            <div
              key={g.id}
              className={`bg-slate-800 border rounded-xl px-5 py-4 flex items-center justify-between gap-4 ${
                g.ativo ? 'border-slate-700' : 'border-slate-700 opacity-60'
              }`}
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-white font-semibold text-sm truncate">{g.nome}</span>
                <span className="text-slate-400 text-xs truncate">{g.email}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  g.ativo ? 'bg-green-600/15 text-green-400' : 'bg-slate-700 text-slate-400'
                }`}>
                  {g.ativo ? 'Ativo' : 'Inativo'}
                </span>
                <button
                  onClick={() => toggleMutation.mutate(g.id)}
                  className="text-slate-400 hover:text-orange-400 transition-colors cursor-pointer"
                >
                  {g.ativo ? <ToggleRight size={24} className="text-orange-500" /> : <ToggleLeft size={24} />}
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
              <h2 className="text-white font-semibold">Novo Gestor</h2>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-white cursor-pointer text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit((d) => criarMutation.mutate(d))} className="p-6 flex flex-col gap-4">
              {[
                { field: 'nome', label: 'Nome *', placeholder: 'Nome completo' },
                { field: 'email', label: 'E-mail *', placeholder: 'gestor@empresa.com' },
              ].map(({ field, label, placeholder }) => (
                <div key={field} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</label>
                  <input
                    {...register(field as keyof FormData, { required: true })}
                    placeholder={placeholder}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">PIN (4 dígitos) *</label>
                <input
                  {...register('senha', { required: true, minLength: 4, maxLength: 4, pattern: /^\d{4}$/ })}
                  type="password"
                  placeholder="4 dígitos numéricos"
                  maxLength={4}
                  inputMode="numeric"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
                />
              </div>

              {erroCriar && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {erroCriar?.response?.data?.message ?? 'Erro ao criar gestor.'}
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
