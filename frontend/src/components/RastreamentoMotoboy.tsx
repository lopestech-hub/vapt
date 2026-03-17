import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { assistirMotoboy, type LocalizacaoPayload, type PontoRota } from '../services/localizacaoSocket';
import { MapPin, Clock, Navigation, Wifi, WifiOff, Route } from 'lucide-react';

// Ícone personalizado para posição atual (evita problema de imagem no Vite)
const iconeAtual = L.divIcon({
  html: `<div style="width:18px;height:18px;background:#f97316;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.6)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  className: '',
});

// Ícone para início da rota
const iconeInicio = L.divIcon({
  html: `<div style="width:12px;height:12px;background:#22c55e;border:2px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.5)"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  className: '',
});

// Fórmula Haversine para calcular distância em km entre dois pontos
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function calcularKmTotal(pontos: PontoRota[]): number {
  let total = 0;
  for (let i = 1; i < pontos.length; i++) {
    total += haversine(pontos[i - 1].lat, pontos[i - 1].lng, pontos[i].lat, pontos[i].lng);
  }
  return total;
}

// Componente interno que move o mapa para a posição atual
function MoverMapa({ lat, lng }: { lat: number; lng: number }) {
  const mapa = useMap();
  useEffect(() => {
    mapa.setView([lat, lng], mapa.getZoom());
  }, [lat, lng, mapa]);
  return null;
}

interface Props {
  motoboyId: string;
  nomeMotboy: string;
}

export function RastreamentoMotoboy({ motoboyId, nomeMotboy }: Props) {
  const [localizacao, setLocalizacao] = useState<LocalizacaoPayload | null>(null);
  const [historico, setHistorico] = useState<PontoRota[]>([]);
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    setConectado(true);
    setHistorico([]);
    setLocalizacao(null);

    const parar = assistirMotoboy(
      motoboyId,
      // Novo ponto em tempo real — adiciona ao histórico
      (payload) => {
        setLocalizacao(payload);
        setHistorico((prev) => [...prev, { lat: payload.latitude, lng: payload.longitude, atualizadoEm: payload.atualizadoEm }]);
      },
      // Histórico completo ao conectar
      (hist) => {
        setHistorico(hist.pontos);
        if (hist.pontos.length > 0) {
          const ultimo = hist.pontos[hist.pontos.length - 1];
          setLocalizacao({
            motoboyId,
            latitude: ultimo.lat,
            longitude: ultimo.lng,
            atualizadoEm: ultimo.atualizadoEm,
          });
        }
      },
    );

    return () => {
      parar();
      setConectado(false);
    };
  }, [motoboyId]);

  const kmTotal = useMemo(() => calcularKmTotal(historico), [historico]);

  const polylinePoints = useMemo(
    () => historico.map((p) => [p.lat, p.lng] as [number, number]),
    [historico],
  );

  const formatarHora = (data: Date | string) =>
    new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const linkMaps = localizacao
    ? `https://www.google.com/maps?q=${localizacao.latitude},${localizacao.longitude}`
    : null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
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

      {localizacao ? (
        <>
          {/* Mapa embutido */}
          <div style={{ height: 280 }}>
            <MapContainer
              center={[localizacao.latitude, localizacao.longitude]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Rota percorrida */}
              {polylinePoints.length > 1 && (
                <Polyline
                  positions={polylinePoints}
                  pathOptions={{ color: '#f97316', weight: 4, opacity: 0.85 }}
                />
              )}

              {/* Marcador de início da rota */}
              {historico.length > 1 && (
                <Marker position={[historico[0].lat, historico[0].lng]} icon={iconeInicio} />
              )}

              {/* Marcador de posição atual */}
              <Marker position={[localizacao.latitude, localizacao.longitude]} icon={iconeAtual} />

              {/* Move o mapa junto com o motoboy */}
              <MoverMapa lat={localizacao.latitude} lng={localizacao.longitude} />
            </MapContainer>
          </div>

          {/* Informações */}
          <div className="p-4 space-y-3">
            {/* Km e última atualização */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Route size={15} className="text-orange-500 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Distância percorrida</p>
                  <p className="text-sm font-semibold text-slate-200">
                    {kmTotal < 1 ? `${(kmTotal * 1000).toFixed(0)} m` : `${kmTotal.toFixed(2)} km`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Clock size={15} className="text-slate-500 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Última atualização</p>
                  <p className="text-sm text-slate-200">{formatarHora(localizacao.atualizadoEm)}</p>
                </div>
              </div>
            </div>

            {/* Coordenadas + link */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-slate-500" />
                <span className="text-xs text-slate-400 font-mono">
                  {localizacao.latitude.toFixed(6)}, {localizacao.longitude.toFixed(6)}
                </span>
              </div>
              {linkMaps && (
                <a
                  href={linkMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange-400 hover:text-orange-300 underline cursor-pointer"
                >
                  Abrir no Maps
                </a>
              )}
            </div>

            {/* Pontos registrados */}
            {historico.length > 0 && (
              <p className="text-xs text-slate-600">
                {historico.length} ponto{historico.length !== 1 ? 's' : ''} registrado{historico.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-8 px-4">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse mx-auto mb-2" />
          <p className="text-xs text-slate-500">Aguardando localização de {nomeMotboy}...</p>
          <p className="text-xs text-slate-600 mt-1">Atualiza a cada 1 minuto quando em entrega</p>
        </div>
      )}
    </div>
  );
}
