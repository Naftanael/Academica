// src/app/classrooms/new/page.tsx
import NewClassroomForm from "@/components/classrooms/NewClassroomForm";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from 'lucide-react';

/**
 * Page for creating a new classroom.
 * This component sets up the page layout and renders the form for adding a new classroom.
 */
export default function NewClassroomPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Adicionar Nova Sala"
        description="Preencha os detalhes abaixo para adicionar uma nova sala de aula."
        actions={
          <Button asChild variant="outline">
            <Link href="/classrooms">
               <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />
      <NewClassroomForm />
    </div>
  );
}