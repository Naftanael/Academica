// src/app/announcements/[id]/edit/page.tsx
import { getAnnouncementById } from "@/lib/actions/announcements";
import EditAnnouncementForm from "@/components/announcements/EditAnnouncementForm";
import PageHeader from "@/components/shared/PageHeader";
import { notFound } from "next/navigation";

interface EditAnnouncementPageProps {
  params: {
    id: string;
  };
}

/**
 * Page for editing an existing announcement.
 * Fetches announcement data on the server and passes it to the form.
 */
export default async function EditAnnouncementPage({ params }: EditAnnouncementPageProps) {
  const announcement = await getAnnouncementById(params.id);

  if (!announcement) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar Anúncio"
        description="Faça alterações em um anúncio existente."
      />
      <EditAnnouncementForm announcement={announcement} />
    </div>
  );
}
