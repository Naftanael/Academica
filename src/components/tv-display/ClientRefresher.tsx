'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Este é um componente de cliente leve que simplesmente força uma
 * atualização de dados do lado do servidor periodicamente, garantindo que o painel de TV
 * permaneça atualizado sem um recarregamento completo da página.
 */
export default function ClientRefresher() {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh();
    }, REFRESH_INTERVAL_MS);

    // Limpa o temporizador se o componente for desmontado.
    return () => clearInterval(timer);
  }, [router]);

  return null; // Este componente não renderiza nada.
}
