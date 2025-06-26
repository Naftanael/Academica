
'use client';

import { useEffect } from 'react';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * A client component that forces a full page reload on a set interval.
 * It renders nothing to the DOM.
 */
export default function ClientRefresher() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.reload();
    }, REFRESH_INTERVAL_MS);

    // Cleanup the timer if the component is unmounted
    return () => clearTimeout(timer);
  }, []); // The empty dependency array ensures this effect runs only once on mount

  return null;
}
