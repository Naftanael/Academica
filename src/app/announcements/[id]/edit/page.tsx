
import Link from 'next/link';
import { ArrowLeft, Megaphone } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAnnouncementById } from '@/lib/actions/announcements';
import EditAnnouncementForm from '@/components/announcements/EditAnnouncementForm';

export default async function EditAnnouncementPage({ params }: { params: { id: string } }) {
  const announcement = await getAnnouncementById(params.id);

  if (!announcement) {
    return (
        <div className="text-center py-10">
            <p>Anúncio não encontrado.</p>
            <Button asChild variant="link">
                <Link href="/announcements">Voltar para a lista</Link>
            </Button>
        </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Editar Anúncio"
        description="Modifique a notícia ou comunicado."
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
          <EditAnnouncementForm announcement={announcement} />
        </CardContent>
      </Card>
    </>
  );
}
