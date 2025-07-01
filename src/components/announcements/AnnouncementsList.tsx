
'use client';

import * as React from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Megaphone, Edit, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Announcement } from '@/types';
import { cn } from '@/lib/utils';
import { DeleteConfirmationDialog } from '@/components/shared/DeleteConfirmationDialog';
import { useToast } from '@/hooks/use-toast';
import { deleteAnnouncement } from '@/lib/actions/announcements';

interface AnnouncementsListProps {
  announcements: Announcement[];
}

function DeleteAnnouncementButton({ announcementId }: { announcementId: string }) {
  const { toast } = useToast();
  const handleDelete = async () => {
    const result = await deleteAnnouncement(announcementId);
    if (result.success) {
      toast({ title: 'Sucesso!', description: result.message });
    } else {
      toast({ title: 'Erro', description: result.message, variant: 'destructive' });
    }
  };
  return (
    <DeleteConfirmationDialog
      onConfirm={handleDelete}
      triggerButton={
        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
        </Button>
      }
      dialogTitle="Excluir Anúncio?"
      dialogDescription="Esta ação não pode ser desfeita e o anúncio será removido permanentemente."
    />
  );
}

export default function AnnouncementsList({ announcements }: AnnouncementsListProps) {
  if (announcements.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Megaphone className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-foreground">Nenhum anúncio encontrado.</h3>
          <p className="text-muted-foreground mt-2 mb-6">Comece criando o primeiro anúncio para a sua instituição.</p>
          <Button asChild>
            <Link href="/announcements/new">
              Criar Primeiro Anúncio
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      {announcements.map((announcement) => (
        <Card key={announcement.id} className="flex flex-col shadow-lg rounded-lg">
          <CardHeader>
            <div className="flex justify-between items-start gap-2">
                <CardTitle className="font-headline text-lg">{announcement.title}</CardTitle>
                <Badge 
                    variant={announcement.priority === 'Urgente' ? 'destructive' : 'secondary'}
                    className={cn(announcement.priority === 'Urgente' && 'flex items-center gap-1')}
                >
                    {announcement.priority === 'Urgente' && <AlertTriangle className="h-3 w-3" />}
                    {announcement.priority}
                </Badge>
            </div>
            <CardDescription>
                {announcement.type} - Por {announcement.author} em {format(parseISO(announcement.createdAt), "dd 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{announcement.content}</p>
          </CardContent>
          <CardFooter className="flex justify-between items-center bg-muted/30 p-4">
             <div className="flex items-center gap-2 text-sm">
                {announcement.published ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={cn(announcement.published ? 'text-primary' : 'text-muted-foreground')}>
                    {announcement.published ? 'Publicado' : 'Rascunho'}
                </span>
             </div>
             <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/announcements/${announcement.id}/edit`}>
                        <Edit className="h-4 w-4" />
                    </Link>
                </Button>
                <DeleteAnnouncementButton announcementId={announcement.id} />
             </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
