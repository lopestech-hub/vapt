import { useEffect, useRef } from 'react';

const INTERVALO_MS = 5 * 60 * 1000; // verifica a cada 5 minutos

export function useDetectorVersao() {
  const versaoAtual = useRef<string | null>(null);

  useEffect(() => {
    const verificar = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`);
        if (!res.ok) return;

        const dados = await res.json();

        if (versaoAtual.current === null) {
          // primeira verificação — armazena a versão inicial
          versaoAtual.current = dados.version;
          return;
        }

        if (dados.version !== versaoAtual.current) {
          // nova versão detectada — recarrega a página
          window.location.reload();
        }
      } catch {
        // falha silenciosa — não interrompe o usuário
      }
    };

    verificar();
    const intervalo = setInterval(verificar, INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, []);
}
