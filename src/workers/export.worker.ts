
import html2canvas from 'html2canvas';

self.onmessage = async (event) => {
  const { url } = event.data;

  try {
    const iframe = await createIframe(url);
    const canvas = await captureCanvas(iframe);
    
    // The canvas.toBlob callback needs to be handled via a Promise
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });

    if (blob) {
      self.postMessage({ type: 'SUCCESS', blob });
    } else {
      self.postMessage({ type: 'ERROR', message: 'Failed to create blob from canvas' });
    }
    
    // Clean up the iframe after we are done
    document.body.removeChild(iframe);

  } catch (error) {
    self.postMessage({ type: 'ERROR', message: (error as Error).message });
  }
};

function createIframe(url: string): Promise<HTMLIFrameElement> {
    return new Promise((resolve, reject) => {
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.style.top = '-9999px';
        iframe.style.width = '1920px';
        iframe.style.height = '1080px';
        iframe.onload = () => resolve(iframe);
        iframe.onerror = () => reject(new Error('Failed to load iframe content.'));
        document.body.appendChild(iframe);
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
        } as any).then(resolve).catch(reject); // Use 'as any' to bypass the strict type check for the 'scale' property.
    });
}
