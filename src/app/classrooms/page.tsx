// src/app/classrooms/page.tsx
import { getClassrooms } from "@/lib/actions/classrooms";
import ClassroomsDisplay from "@/components/classrooms/ClassroomsDisplay";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, School } from 'lucide-react';

/**
 * Renders a loading skeleton for the classrooms display.
 * This provides a better user experience by showing a placeholder while data is being fetched.
 */
function ClassroomsLoading() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/**
 * Fetches and displays the list of classrooms.
 * This is an async Server Component, which allows for direct data fetching on the server.
 */
async function ClassroomsList() {
  const classrooms = await getClassrooms();
  return <ClassroomsDisplay classrooms={classrooms} />;
}

/**
 * The main page component for the classrooms section.
 * It sets up the page layout and uses Suspense to handle the loading state of the classroom list.
 */
export default function ClassroomsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Salas de Aula"
        description="Gerencie as salas de aula disponíveis na instituição."
        icon={School}
      >
        <Button asChild>
          <Link href="/classrooms/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Nova Sala
          </Link>
        </Button>
      </PageHeader>
      
      <Suspense fallback={<ClassroomsLoading />}>
        <ClassroomsList />
      </Suspense>
    </div>
  );
}