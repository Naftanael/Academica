
'use client';

import * as React from 'react';
import { MonitorUp, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function PublishTvPanelButton() {
  const { toast } = useToast();
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleClick = async () => {
    setStatus('loading');
    try {
      const response = await fetch('/api/publish-tv-panel', {
        method: 'POST',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Falha ao publicar painel.');
      }

      setStatus('success');
      toast({
        title: 'Sucesso!',
        description: 'Os painéis de TV serão atualizados em breve.',
      });
      // Reset status after a few seconds
      setTimeout(() => setStatus('idle'), 3000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      setStatus('error');
      toast({
        title: 'Erro na Publicação',
        description: errorMessage,
        variant: 'destructive',
      });
      // Reset status after a few seconds
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case 'loading':
        return <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publicando...</>;
      case 'success':
        return <><CheckCircle className="mr-2 h-4 w-4" /> Publicado!</>;
      case 'error':
        return <><AlertCircle className="mr-2 h-4 w-4" /> Falha ao Publicar</>;
      default:
        return <><MonitorUp className="mr-2 h-4 w-4" /> Publicar Painel TV</>;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleClick}
            disabled={status === 'loading' || status === 'success'}
            className={
              status === 'success' ? 'bg-green-600 hover:bg-green-700' :
              status === 'error' ? 'bg-destructive hover:bg-destructive/90' :
              'bg-accent hover:bg-accent/90 text-accent-foreground'
            }
          >
            {getButtonContent()}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Atualiza o conteúdo exibido em todas as telas de TV.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
