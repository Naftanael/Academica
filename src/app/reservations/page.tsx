
import PageHeader from '@/components/shared/PageHeader';
import { ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ReservationsPage() {
  return (
    <>
      <PageHeader
        title="Reservas de Salas"
        description="Gerencie as reservas de salas especiais e laboratórios."
        icon={ListChecks}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Gerenciamento de Reservas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <ListChecks className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
            <h3 className="text-xl font-semibold mb-2">Funcionalidade em Breve</h3>
            <p className="text-muted-foreground mb-6">
              A funcionalidade para cadastrar e gerenciar reservas pontuais de salas estará disponível aqui em breve.
            </p>
            <Button variant="outline" asChild>
              <Link href="/">
                Voltar para o Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
