
import html2canvas from 'html2canvas';

self.onmessage = async (event) => {
  const { url } = event.data;

  try {
    const iframe = await createIframe(url);
    const canvas = await captureCanvas(iframe);
    const blob = await canvas.toBlob((blob) => {
        if (blob) {
            self.postMessage({ type: 'SUCCESS', blob });
        } else {
            self.postMessage({ type: 'ERROR', message: 'Failed to create blob from canvas' });
        }
        // Clean up the iframe
        document.body.removeChild(iframe);
    }, 'image/png');
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
    return html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        width: 1920,
        height: 1080,
        // @ts-ignore
        scale: 1,
    });
}
