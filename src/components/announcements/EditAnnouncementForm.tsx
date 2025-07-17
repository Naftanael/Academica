// src/components/announcements/EditAnnouncementForm.tsx
'use client';

import { useEffect } from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { announcementEditSchema, AnnouncementEditFormValues } from '@/lib/schemas/announcements';
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

  const form = useForm<AnnouncementEditFormValues>({
    resolver: zodResolver(announcementEditSchema),
    defaultValues: {
      title: announcement.title || '',
      content: announcement.content || '',
    },
  });

  const onSubmit = (data: AnnouncementEditFormValues) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    formAction(formData);
  };

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
     // Clear form errors if the submission was successful
     if (state.success) {
      form.clearErrors();
    } else if (state.errors) {
      // Manually set form errors from the server response
      Object.keys(state.errors).forEach((key) => {
        const field = key as keyof AnnouncementEditFormValues;
        const message = state.errors?.[field]?.[0];
        if (message) {
          form.setError(field, { type: 'server', message });
        }
      });
    }
  }, [state, toast, router, form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
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
