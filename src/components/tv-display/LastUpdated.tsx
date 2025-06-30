'use client';

import { useState, useEffect } from 'react';

export default function LastUpdated({ lastPublished }: { lastPublished: string }) {
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    setLastUpdated(
      new Date(lastPublished).toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      })
    );
  }, [lastPublished]);

  return <p className="text-sm text-gray-400 mt-2">Última atualização: {lastUpdated}</p>;
}
