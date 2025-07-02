'use client';

import { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ExportTvDisplayButton() {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = () => {
    setIsExporting(true);
    toast({
      title: 'Iniciando Exportação',
      description: 'Renderizando o painel da TV. Isso pode levar alguns segundos...',
    });

    const iframe = document.createElement('iframe');
    iframe.src = '/tv-display?export=true'; // Add parameter to signal export mode
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '1920px';
    iframe.style.height = '1080px';
    document.body.appendChild(iframe);

    // This function will be called when the iframe is ready
    const capture = async () => {
      try {
        if (!iframe.contentWindow?.document.body) {
            throw new Error('Não foi possível carregar o conteúdo do painel da TV.');
        }

        const canvas = await html2canvas(iframe.contentWindow.document.body, {
            useCORS: true,
            allowTaint: true,
            width: 1920,
            height: 1080,
            // @ts-ignore - The 'scale' property is valid but missing from older type definitions.
            scale: 1,
        });

        const link = document.createElement('a');
        link.download = `tv-display-export-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: 'Exportação Concluída',
          description: 'O download da imagem do painel da TV deve começar em breve.',
          variant: 'default',
        });
      } catch (error) {
          console.error('Falha ao exportar o painel da TV:', error);
          toast({
              title: 'Erro na Exportação',
              description: `Ocorreu um erro: ${error instanceof Error ? error.message : String(error)}`,
              variant: 'destructive',
          });
      } finally {
        window.removeEventListener('message', messageListener);
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        setIsExporting(false);
      }
    };

    const messageListener = (event: MessageEvent) => {
        // Security check: ensure the message is from a trusted source if necessary
        if (event.data === 'tv-display-ready-for-capture') {
            // Give a little extra time for final renders
            setTimeout(capture, 500);
        }
    };
    
    window.addEventListener('message', messageListener);

    // Timeout as a fallback
    setTimeout(() => {
      if (isExporting) {
        toast({
          title: 'A exportação está demorando muito',
          description: 'Pode haver um problema com o carregamento do painel. Tentando capturar de qualquer maneira...',
          variant: 'destructive'
        });
        // Try to capture anyway
        capture();
      }
    }, 20000); // 20 seconds timeout
  };

  return (
    <Button onClick={handleExport} disabled={isExporting}>
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exportando...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Exportar Painel TV
        </>
      )}
    </Button>
  );
}
