'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AlertTriangle, RotateCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-lg text-center shadow-2xl">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-4 rounded-full">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">Ocorreu um Erro Inesperado</CardTitle>
          <CardDescription className="text-muted-foreground">
            A aplicação encontrou um problema. Por favor, tente novamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="bg-muted p-4 rounded-md text-left text-xs text-muted-foreground overflow-auto max-h-32">
                <p className="font-mono">{error.message || 'Não foi possível carregar os detalhes do erro.'}</p>
            </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button
            onClick={() => reset()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <RotateCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Voltar ao Início
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
