
import Link from 'next/link';
import { PlusCircle, Megaphone } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { getAnnouncements } from '@/lib/actions/announcements';
import AnnouncementsList from '@/components/announcements/AnnouncementsList';

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements();

  return (
    <>
      <PageHeader
        title="Notícias e Comunicados"
        description="Gerencie os anúncios e comunicados da instituição."
        icon={Megaphone}
        actions={
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/announcements/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Anúncio
            </Link>
          </Button>
        }
      />
      <AnnouncementsList announcements={announcements} />
    </>
  );
}
