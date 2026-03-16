import { useEffect, useState } from 'react';
import { assistirMotoboy, type LocalizacaoPayload } from '../services/localizacaoSocket';
import { MapPin, Clock, Navigation, Wifi, WifiOff } from 'lucide-react';

interface Props {
  motoboyId: string;
  nomeMotboy: string;
}

export function RastreamentoMotoboy({ motoboyId, nomeMotboy }: Props) {
  const [localizacao, setLocalizacao] = useState<LocalizacaoPayload | null>(null);
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    setConectado(true);
    const parar = assistirMotoboy(motoboyId, (payload) => {
      setLocalizacao(payload);
    });

    return () => {
      parar();
      setConectado(false);
    };
  }, [motoboyId]);

  const formatarHora = (data: Date | string) => {
    return new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const linkMaps = localizacao
    ? `https://www.google.com/maps?q=${localizacao.latitude},${localizacao.longitude}`
    : null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation size={16} className="text-orange-500" />
          <span className="text-sm font-semibold text-slate-200">Rastreamento em Tempo Real</span>
        </div>
        <div className="flex items-center gap-1.5">
          {conectado
            ? <><Wifi size={14} className="text-green-400" /><span className="text-xs text-green-400">Conectado</span></>
            : <><WifiOff size={14} className="text-slate-500" /><span className="text-xs text-slate-500">Aguardando...</span></>
          }
        </div>
      </div>

      {/* Localização */}
      {localizacao ? (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin size={15} className="text-orange-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-slate-400">Coordenadas</p>
              <p className="text-sm text-slate-200 font-mono">
                {localizacao.latitude.toFixed(6)}, {localizacao.longitude.toFixed(6)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock size={15} className="text-slate-500 shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Última atualização</p>
              <p className="text-sm text-slate-200">{formatarHora(localizacao.atualizadoEm)}</p>
            </div>
          </div>

          {linkMaps && (
            <a
              href={linkMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <MapPin size={14} />
              Ver no Google Maps
            </a>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse mx-auto mb-2" />
          <p className="text-xs text-slate-500">
            Aguardando localização de {nomeMotboy}...
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Atualiza a cada 1 minuto quando em entrega
          </p>
        </div>
      )}
    </div>
  );
}
