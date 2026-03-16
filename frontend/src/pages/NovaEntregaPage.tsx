import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import { api } from '../services/api';

interface FormData {
  motoboy_id: string;
  cliente_nome: string;
  cliente_telefone: string;
  endereco_origem: string;
  endereco_destino: string;
  observacoes: string;
}

export function NovaEntregaPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const { data: motoboys = [] } = useQuery({
    queryKey: ['motoboys'],
    queryFn: () => api.get('/admin/motoboys').then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/admin/entregas', data),
    onSuccess: () => navigate('/entregas'),
  });

  function onSubmit(data: FormData) {
    mutation.mutate(data);
  }

  const erro = mutation.error as any;

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
        <div>
          <h1 className="text-2xl font-bold text-white">Nova Entrega</h1>
          <p className="text-slate-400 text-sm mt-0.5">Criar e atribuir uma nova entrega</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col gap-5">
        {/* Motoboy */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Motoboy *
          </label>
          <select
            {...register('motoboy_id', { required: 'Selecione um motoboy' })}
            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm cursor-pointer"
          >
            <option value="">Selecione o motoboy</option>
            {motoboys.filter((m: any) => m.ativo).map((m: any) => (
              <option key={m.id} value={m.id}>
                {m.nome} — {m.placa_moto}
              </option>
            ))}
          </select>
          {errors.motoboy_id && <p className="text-red-400 text-xs">{errors.motoboy_id.message}</p>}
        </div>

        {/* Cliente */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Nome do Cliente *
            </label>
            <input
              {...register('cliente_nome', { required: 'Campo obrigatório' })}
              placeholder="Ex: Maria Silva"
              className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors text-sm"
            />
            {errors.cliente_nome && <p className="text-red-400 text-xs">{errors.cliente_nome.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Telefone
            </label>
            <input
              {...register('cliente_telefone')}
              placeholder="(11) 99999-0000"
              className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors text-sm"
            />
          </div>
        </div>

        {/* Endereços */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Endereço de Origem *
          </label>
          <input
            {...register('endereco_origem', { required: 'Campo obrigatório' })}
            placeholder="Ex: Rua das Flores, 100 - Centro"
            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors text-sm"
          />
          {errors.endereco_origem && <p className="text-red-400 text-xs">{errors.endereco_origem.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Endereço de Destino *
          </label>
          <input
            {...register('endereco_destino', { required: 'Campo obrigatório' })}
            placeholder="Ex: Av. Paulista, 1500 - Bela Vista"
            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors text-sm"
          />
          {errors.endereco_destino && <p className="text-red-400 text-xs">{errors.endereco_destino.message}</p>}
        </div>

        {/* Observações */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Observações
          </label>
          <textarea
            {...register('observacoes')}
            placeholder="Instruções especiais, referências, etc."
            rows={3}
            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors text-sm resize-none"
          />
        </div>

        {erro && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {erro?.response?.data?.message ?? 'Erro ao criar entrega.'}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 h-11 border border-slate-600 text-slate-300 hover:bg-slate-700 font-medium rounded-lg transition-colors cursor-pointer text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex-1 h-11 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center text-sm"
          >
            {mutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Criar Entrega'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
