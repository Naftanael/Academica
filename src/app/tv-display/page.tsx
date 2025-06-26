
'use client';

import * as React from 'react';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// This is a lightweight client component that simply displays the generated image
// and refreshes it periodically.
export default function TvDisplayPage() {
  const [imageUrl, setImageUrl] = React.useState('/tv_panel.png');

  React.useEffect(() => {
    // This timer reloads the image source by adding a timestamp,
    // which bypasses the browser cache.
    const timer = setInterval(() => {
      // The base URL remains the same, but the query parameter forces a refetch.
      setImageUrl(`/tv_panel.png?t=${new Date().getTime()}`);
    }, REFRESH_INTERVAL_MS);

    // Cleanup the timer if the component is unmounted.
    return () => clearInterval(timer);
  }, []); // The empty dependency array ensures this effect runs only once on mount.

  // Using inline styles for maximum compatibility on older browser engines.
  return (
    <>
      <style>{`
        body, html {
          margin: 0;
          padding: 0;
          overflow: hidden;
          width: 100%;
          height: 100%;
          background-color: #000;
        }
        img#panel-display {
          display: block;
          width: 100vw;
          height: 100vh;
          object-fit: contain; /* Ensures the image fits without being distorted */
          object-position: center center;
        }
      `}</style>
      <img 
        id="panel-display" 
        src={imageUrl} 
        alt="Carregando painel de salas..." 
      />
    </>
  );
}
