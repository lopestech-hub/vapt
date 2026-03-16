import { useQuery } from '@tanstack/react-query';
import { Truck, Users, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { api } from '../services/api';

interface Stats {
  totalMotoboys: number;
  motoboysTrabalhando: number;
  entregasHoje: number;
  entregasPendentes: number;
  entregasEmRota: number;
  entregasConcluidasHoje: number;
  totalEntregas: number;
}

function StatCard({
  titulo,
  valor,
  icon: Icon,
  cor,
  sub,
}: {
  titulo: string;
  valor: number;
  icon: React.ElementType;
  cor: string;
  sub?: string;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400">{titulo}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cor}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-white">{valor}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/admin/dashboard').then((r) => r.data),
    refetchInterval: 30000, // atualiza a cada 30s
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Visão geral das operações em tempo real</p>
      </div>

      {/* Cards de stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          titulo="Entregas Hoje"
          valor={stats?.entregasHoje ?? 0}
          icon={TrendingUp}
          cor="bg-orange-500"
        />
        <StatCard
          titulo="Pendentes"
          valor={stats?.entregasPendentes ?? 0}
          icon={AlertCircle}
          cor="bg-yellow-500"
          sub="Aguardando início"
        />
        <StatCard
          titulo="Em Rota"
          valor={stats?.entregasEmRota ?? 0}
          icon={Truck}
          cor="bg-blue-500"
          sub="Motoboys em campo"
        />
        <StatCard
          titulo="Concluídas Hoje"
          valor={stats?.entregasConcluidasHoje ?? 0}
          icon={CheckCircle}
          cor="bg-green-600"
        />
        <StatCard
          titulo="Motoboys Ativos"
          valor={stats?.motoboysTrabalhando ?? 0}
          icon={Users}
          cor="bg-purple-500"
          sub={`de ${stats?.totalMotoboys ?? 0} cadastrados`}
        />
        <StatCard
          titulo="Total de Entregas"
          valor={stats?.totalEntregas ?? 0}
          icon={Clock}
          cor="bg-slate-600"
          sub="Histórico completo"
        />
      </div>
    </div>
  );
}
