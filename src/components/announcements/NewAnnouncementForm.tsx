// src/components/announcements/NewAnnouncementForm.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { announcementSchema, AnnouncementFormValues } from '@/lib/schemas/announcements';
import { createAnnouncement } from '@/lib/actions/announcements';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import FormSubmitButton from '@/components/shared/FormSubmitButton';

const initialState = {
  success: false,
  message: '',
  errors: {},
};

export default function NewAnnouncementForm() {
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  
  // Note: The action now returns a different shape.
  const [state, formAction] = useFormState(createAnnouncement, initialState);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      content: '',
    },
    // Pass form-level errors to the form context
    context: state.errors,
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

  const handleSubmit = (data: AnnouncementFormValues) => {
    // The `formAction` expects FormData. We need to create it manually.
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    
    // We can't directly use the hook's `formAction` with `react-hook-form`'s `handleSubmit`.
    // Instead, we trigger the form submission manually.
    // The `formAction` will be called by the form's `action` attribute.
    // This approach is a bit of a workaround to integrate `react-hook-form` with `useFormState`.
    // A hidden submit button or programmatically calling form.submit() might also work.
    
    // For simplicity and correctness with Server Actions, we'll let RHF handle validation,
    // and then we'll create a new `formAction` call with the validated data.
    // This slightly deviates from the pure `useFormState` on `form`, but is a common pattern with RHF.
    // Let's stick to the ref-based submission to keep `useFormState` working as intended.
    
    // First, set the values on the form fields manually (or ensure they are set)
    if(formRef.current) {
        (formRef.current.elements.namedItem('title') as HTMLInputElement).value = data.title;
        (formRef.current.elements.namedItem('content') as HTMLInputElement).value = data.content;
        formRef.current.requestSubmit();
    }
  };


  return (
    <Form {...form}>
      <form
        ref={formRef}
        action={formAction}
        className="space-y-8"
        // We use RHF for validation, and on valid submit, we trigger the form action
        onSubmit={form.handleSubmit(() => formRef.current?.submit())}
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
        
        <FormSubmitButton>Publicar Anúncio</FormSubmitButton>
      </form>
    </Form>
  );
}
