// src/components/classrooms/NewClassroomForm.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { classroomSchema, ClassroomFormValues } from '@/lib/schemas/classrooms';
import { createClassroom } from '@/lib/actions/classrooms';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import FormSubmitButton from '@/components/shared/FormSubmitButton';

const initialState = {
  message: '',
  errors: {},
};

export default function NewClassroomForm() {
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(createClassroom, initialState);
  
  const form = useForm<ClassroomFormValues>({
    resolver: zodResolver(classroomSchema),
    defaultValues: {
      name: '',
      capacity: 0,
      isUnderMaintenance: false,
      maintenanceReason: '',
    },
    context: state.errors,
  });

  useEffect(() => {
    if (state.message) {
      if (state.message.includes('sucesso')) {
        toast({
          title: "Sucesso!",
          description: state.message,
        });
        router.push('/classrooms');
      } else {
        toast({
          title: "Erro",
          description: state.message,
          variant: "destructive",
        });
      }
    }
    if (state.errors) {
        // You can handle specific field errors here if needed
    }
  }, [state, toast, router]);

  const isUnderMaintenance = form.watch('isUnderMaintenance');

  return (
    <Form {...form}>
      <form
        ref={formRef}
        action={formAction}
        className="space-y-8"
        onSubmit={form.handleSubmit(() => formRef.current?.submit())}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Sala</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Sala 101" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacidade</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Ex: 30" 
                  {...field} 
                  onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isUnderMaintenance"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Em manutenção</FormLabel>
              </div>
            </FormItem>
          )}
        />
        
        {isUnderMaintenance && (
          <FormField
            control={form.control}
            name="maintenanceReason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo da Manutenção</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Projetor quebrado" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormSubmitButton>Criar Sala de Aula</FormSubmitButton>
      </form>
    </Form>
  );
}

