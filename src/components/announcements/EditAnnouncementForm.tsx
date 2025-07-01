
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';

import { announcementSchema, ANNOUNCEMENT_TYPES, ANNOUNCEMENT_PRIORITIES, type AnnouncementFormValues } from '@/lib/schemas/announcements';
import { updateAnnouncement } from '@/lib/actions/announcements';
import { useToast } from '@/hooks/use-toast';
import type { Announcement } from '@/types';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';

interface EditAnnouncementFormProps {
    announcement: Announcement;
}

export default function EditAnnouncementForm({ announcement }: EditAnnouncementFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: announcement.title,
      content: announcement.content,
      author: announcement.author,
      type: announcement.type,
      priority: announcement.priority,
      published: announcement.published,
    },
  });

  const onSubmit = (values: AnnouncementFormValues) => {
    startTransition(async () => {
      const result = await updateAnnouncement(announcement.id, values);
      if (result.success) {
        toast({ title: "Sucesso!", description: result.message });
        router.push('/announcements');
      } else {
        toast({ title: "Erro", description: result.message || 'Falha ao atualizar anúncio.', variant: 'destructive' });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Início do Período de Matrículas" {...field} />
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
                <Textarea placeholder="Escreva o conteúdo completo da notícia ou comunicado aqui." {...field} rows={6} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="author"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Autor</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Secretaria Acadêmica" {...field} />
              </FormControl>
              <FormDescription>Quem está publicando este anúncio.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      {ANNOUNCEMENT_TYPES.map(type => (
                          <FormItem key={type} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                                <RadioGroupItem value={type} />
                            </FormControl>
                            <FormLabel className="font-normal">{type}</FormLabel>
                          </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Prioridade</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      {ANNOUNCEMENT_PRIORITIES.map(priority => (
                          <FormItem key={priority} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                                <RadioGroupItem value={priority} />
                            </FormControl>
                            <FormLabel className="font-normal">{priority}</FormLabel>
                          </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
         <FormField
          control={form.control}
          name="published"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Publicar?</FormLabel>
                <FormDescription>
                  Anúncios publicados ficam visíveis. Desmarque para salvar como rascunho.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : (
                    <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                    </>
                )}
            </Button>
        </div>
      </form>
    </Form>
  );
}
