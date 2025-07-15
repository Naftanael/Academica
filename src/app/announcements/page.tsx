// src/app/announcements/page.tsx
import Link from 'next/link';
import { PlusCircle, Megaphone } from 'lucide-react';
import { Suspense } from 'react';

import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { getAnnouncements } from '@/lib/actions/announcements';
import AnnouncementsList from '@/components/announcements/AnnouncementsList';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for the announcements list.
 */
function AnnouncementsLoading() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  );
}

/**
 * Async component to fetch and render the list of announcements.
 */
async function Announcements() {
  const announcements = await getAnnouncements();
  return <AnnouncementsList announcements={announcements} />;
}

export default function AnnouncementsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notícias e Comunicados"
        description="Gerencie os anúncios e comunicados da instituição."
        icon={Megaphone}
        actions={
          <Button asChild>
            <Link href="/announcements/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Anúncio
            </Link>
          </Button>
        }
      />
      
      <Suspense fallback={<AnnouncementsLoading />}>
        <Announcements />
      </Suspense>
    </div>
  );
}
