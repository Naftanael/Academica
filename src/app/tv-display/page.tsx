'use client';

import * as React from 'react';

// This component replaces the previous client-side rendered dashboard and the static HTML file.
// It implements the self-refreshing image logic within a minimal Next.js page
// to ensure it works correctly within the application's routing structure and avoids build errors.
export default function TvDisplayPage() {

  // Apply styles to the body for the TV display view
  React.useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.backgroundColor = '#000';

    // Cleanup function to reset styles when the component unmounts
    return () => {
      document.body.style.margin = '';
      document.body.style.overflow = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  // Logic for refreshing the image source
  React.useEffect(() => {
    const REFRESH_INTERVAL_MS = 300000; // 5 minutes
    const imgElement = document.getElementById('painel-display') as HTMLImageElement | null;
    
    if (!imgElement) return;

    // This URL should point to the location where the server-side function saves the generated panel image.
    // For this implementation, we assume it's a static file in the public directory for demonstration.
    const imageUrl = '/dashboards/tv_panel.png';
    
    // Set initial source and start interval
    imgElement.src = imageUrl;

    const intervalId = setInterval(() => {
      // Append a timestamp to the image URL to bypass the browser's cache
      imgElement.src = imageUrl + '?t=' + new Date().getTime();
    }, REFRESH_INTERVAL_MS);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <img 
      id="painel-display" 
      alt="Carregando painel de salas..." 
      style={{
        display: 'block',
        width: '100vw',
        height: '100vh',
        objectFit: 'contain'
      }}
    />
  );
}
