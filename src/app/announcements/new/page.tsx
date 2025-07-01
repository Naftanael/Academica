
import Link from 'next/link';
import { ArrowLeft, Megaphone } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import NewAnnouncementForm from '@/components/announcements/NewAnnouncementForm';

export default function NewAnnouncementPage() {
  return (
    <>
      <PageHeader
        title="Novo Anúncio"
        description="Crie uma nova notícia ou comunicado."
        icon={Megaphone}
        actions={
          <Button variant="outline" asChild>
            <Link href="/announcements">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Lista
            </Link>
          </Button>
        }
      />
      <Card className="max-w-3xl mx-auto shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle>Detalhes do Anúncio</CardTitle>
        </CardHeader>
        <CardContent>
          <NewAnnouncementForm />
        </CardContent>
      </Card>
    </>
  );
}
