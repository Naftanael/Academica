// src/components/announcements/AnnouncementsList.tsx
'use client';

import type { Announcement } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { deleteAnnouncement } from '@/lib/actions/announcements';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


interface AnnouncementsListProps {
  announcements: Announcement[];
}

/**
 * A client component to display a list of announcements.
 */
export default function AnnouncementsList({ announcements }: AnnouncementsListProps) {
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    const result = await deleteAnnouncement(id);
    if (result.success) {
      toast({
        title: 'Sucesso!',
        description: result.message,
      });
    } else {
      toast({
        title: 'Erro',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <h3 className="text-xl font-bold tracking-tight text-gray-900">
          Nenhum anúncio encontrado
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Crie o primeiro anúncio para começar a se comunicar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <Card key={announcement.id}>
          <CardHeader>
            <CardTitle>{announcement.title}</CardTitle>
            <CardDescription>
              Publicado em: {new Date(announcement.createdAt).toLocaleDateString('pt-BR')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{announcement.content}</p>
            <div className="flex justify-end space-x-2">
              <Button asChild variant="outline">
                <Link href={`/announcements/${announcement.id}/edit`}>
                  Editar
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Excluir</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso excluirá permanentemente o anúncio.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(announcement.id)}>
                      Continuar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
