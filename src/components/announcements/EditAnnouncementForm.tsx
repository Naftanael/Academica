// src/components/announcements/EditAnnouncementForm.tsx
'use client';

import { useEffect } from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { announcementSchema, AnnouncementFormValues } from '@/lib/schemas/announcements';
import { updateAnnouncement } from '@/lib/actions/announcements';
import type { Announcement } from '@/types';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import FormSubmitButton from '@/components/shared/FormSubmitButton';

interface EditAnnouncementFormProps {
  announcement: Announcement;
}

const initialState = {
  success: false,
  message: '',
  errors: undefined,
};

export default function EditAnnouncementForm({ announcement }: EditAnnouncementFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const updateAnnouncementWithId = updateAnnouncement.bind(null, announcement.id);
  const [state, formAction] = useFormState(updateAnnouncementWithId, initialState);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: announcement.title || '',
      content: announcement.content || '',
    },
    errors: state.errors,
  });

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: "Sucesso!",
          description: state.message,
        });
        router.push('/announcements');
      } else {
        toast({
          title: "Erro",
          description: state.message,
          variant: "destructive",
        });
      }
    }
  }, [state, toast, router]);

  return (
    <Form {...form}>
      <form
        action={formAction}
        onSubmit={form.handleSubmit(data => formAction(data))}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Feriado de Corpus Christi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conteúdo</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detalhes sobre o anúncio..."
                  className="resize-none"
                  {...field}
                  rows={5}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormSubmitButton>Salvar Alterações</FormSubmitButton>
      </form>
    </Form>
  );
}
