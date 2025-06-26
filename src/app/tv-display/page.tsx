
'use client';

import * as React from 'react';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export default function TvDisplayPage() {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    const refreshIframe = () => {
      if (iframeRef.current) {
        // Appending a timestamp to the URL busts the cache and forces a reload
        const url = `/tv_panel.html?t=${new Date().getTime()}`;
        iframeRef.current.src = url;
      }
    };

    // Initial load
    refreshIframe();

    // Set up periodic refresh
    const intervalId = setInterval(refreshIframe, REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // The parent container ensures the iframe fills the screen without scrollbars.
  return (
    <div style={{
      margin: 0,
      padding: 0,
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      backgroundColor: '#000' // Fallback background color
    }}>
      <iframe
        ref={iframeRef}
        title="Painel de Salas"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
      />
    </div>
  );
}
