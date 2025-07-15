// src/app/announcements/new/page.tsx
import NewAnnouncementForm from "@/components/announcements/NewAnnouncementForm";
import PageHeader from "@/components/shared/PageHeader";

/**
 * Page for creating a new announcement.
 */
export default function NewAnnouncementPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Criar Novo Anúncio"
        description="Escreva e publique um novo anúncio ou comunicado."
      />
      <NewAnnouncementForm />
    </div>
  );
}
