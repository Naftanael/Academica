// src/workers/export.worker.ts
import html2canvas from 'html2canvas';

self.onmessage = async (event) => {
  const { url } = event.data;

  try {
    const iframe = await createIframe(url);
    // The capture needs to happen after the iframe has fully loaded
    iframe.onload = async () => {
      try {
        const canvas = await captureCanvas(iframe.contentDocument!.body);
        
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/png');
        });
    
        if (blob) {
          self.postMessage({ type: 'SUCCESS', blob });
        } else {
          self.postMessage({ type: 'ERROR', message: 'Failed to create blob from canvas' });
        }
        
        document.body.removeChild(iframe);
      } catch (error) {
        self.postMessage({ type: 'ERROR', message: (error as Error).message });
        document.body.removeChild(iframe);
      }
    };
  } catch (error) {
    self.postMessage({ type: 'ERROR', message: (error as Error).message });
  }
};

function createIframe(url: string): Promise<HTMLIFrameElement> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '1920px';
    iframe.style.height = '1080px';
    iframe.style.top = '-1080px'; // Position off-screen
    iframe.style.left = '-1920px';
    iframe.src = url;
    document.body.appendChild(iframe);
    // The onload event will be handled in the main message handler
    resolve(iframe);
  });
}

function captureCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
    // Wrap html2canvas in a true Promise to resolve the type error.
    return new Promise((resolve, reject) => {
        html2canvas(element, {
            useCORS: true,
            allowTaint: true,
            width: 1920,
            height: 1080,
            scale: 1,
        } as any).then(resolve).catch(reject); // Use 'as any' to bypass the strict type check.
    });
}
