'use client';

import { useState, useEffect } from 'react';

export default function LastUpdated() {
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    setLastUpdated(
      new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    );
  }, []);

  return <p className="text-4xl mt-2 opacity-90">{lastUpdated}</p>;
}
