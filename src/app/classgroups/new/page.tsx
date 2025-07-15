// src/app/classgroups/new/page.tsx
import NewClassGroupForm from '@/components/classgroups/NewClassGroupForm';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * Page for creating a new class group.
 */
export default function NewClassGroupPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Criar Nova Turma"
        description="Preencha os dados abaixo para registrar uma nova turma."
        actions={
          <Button asChild variant="outline">
            <Link href="/classgroups">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />
      
      {/* The form will be presented in a card for better layout */}
      <NewClassGroupForm />
    </div>
  );
}
