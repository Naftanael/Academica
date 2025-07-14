
'use client';

// ============================================================================
// Imports
// ============================================================================
import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { PlusCircle, Wrench } from 'lucide-react';

// Componentes da UI reutilizáveis
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

// Hooks e Schemas
import { useToast } from '@/hooks/use-toast';
import { classroomCreateSchema, type ClassroomCreateValues } from '@/lib/schemas/classrooms';

// ============================================================================
// Componente Principal: NewClassroomForm
// ============================================================================
export default function NewClassroomForm() {
  // --------------------------------------------------------------------------
  // Hooks de Estado e Navegação
  // --------------------------------------------------------------------------
  const router = useRouter(); // Hook para navegação programática
  const { toast } = useToast(); // Hook para exibir notificações (toasts)
  const [isPending, setIsPending] = React.useState(false); // Estado para controlar o carregamento do formulário

  // --------------------------------------------------------------------------
  // Configuração do Formulário com React Hook Form
  // --------------------------------------------------------------------------
  const form = useForm<ClassroomCreateValues>({
    // Integração com Zod para validação do schema
    resolver: zodResolver(classroomCreateSchema),
    // Valores padrão para os campos do formulário
    defaultValues: {
      name: '',
      capacity: undefined,
      isUnderMaintenance: false,
      maintenanceReason: '',
    },
  });

  // "Escuta" o valor do campo 'isUnderMaintenance' para renderização condicional
  const isUnderMaintenance = form.watch('isUnderMaintenance');

  // --------------------------------------------------------------------------
  // Função de Submissão do Formulário
  // --------------------------------------------------------------------------
  async function onSubmit(values: ClassroomCreateValues) {
    setIsPending(true); // Ativa o estado de carregamento

    try {
      // Realiza a chamada para a API Route que criamos
      const response = await fetch('/api/classrooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      // Processa a resposta da API
      const result = await response.json();

      if (response.ok) {
        // Caso de Sucesso (status 2xx)
        toast({
          title: 'Sucesso!',
          description: 'Sala de aula criada com sucesso!',
          variant: 'default',
        });
        router.push('/classrooms'); // Redireciona para a lista de salas
        router.refresh(); // Força a atualização dos dados na página de destino
      } else {
        // Caso de Erro (status 4xx ou 5xx)
        if (response.status === 400 && result.errors) {
          // Erro de validação específico retornado pela API
          Object.entries(result.errors).forEach(([field, errors]) => {
            if (errors) {
               form.setError(field as keyof ClassroomCreateValues, {
                type: 'manual',
                message: Array.isArray(errors) ? errors.join(', ') : String(errors),
              });
            }
          });
          toast({
            title: 'Erro de Validação',
            description: "Por favor, corrija os campos destacados.",
            variant: 'destructive',
          });
        } else {
          // Outros erros (ex: conflito de nome, erro interno no servidor)
           toast({
            title: 'Erro ao Criar Sala',
            description: result.message || 'Ocorreu um erro inesperado.',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      // Erro de rede (ex: sem conexão com a internet)
      toast({
        title: 'Erro de Rede',
        description: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
        variant: 'destructive',
      });
    } finally {
      // Garante que o estado de carregamento seja desativado ao final
      setIsPending(false);
    }
  }

  // --------------------------------------------------------------------------
  // Renderização do Componente (JSX)
  // --------------------------------------------------------------------------
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Campo Nome da Sala */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Sala</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Laboratório de Informática 1" {...field} />
              </FormControl>
              <FormDescription>O nome que identificará esta sala.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Capacidade */}
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
                  onChange={event => field.onChange(event.target.value === '' ? undefined : +event.target.value)} 
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>Número máximo de alunos que a sala comporta.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Em Manutenção */}
        <FormField
          control={form.control}
          name="isUnderMaintenance"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-amber-50 dark:bg-amber-900/20">
              <Wrench className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              <div className="space-y-0.5 leading-none">
                <FormLabel className="text-base">Em Manutenção?</FormLabel>
                <FormDescription>Marque se a sala estiver indisponível para uso.</FormDescription>
              </div>
              <FormControl className="ml-auto!important mr-2">
                 <Checkbox checked={field.value} onCheckedChange={field.onChange} aria-label="Marcar como em manutenção" />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Campo Motivo da Manutenção (Condicional) */}
        {isUnderMaintenance && (
          <FormField
            control={form.control}
            name="maintenanceReason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo da Manutenção (Opcional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Ex: Ar condicionado quebrado, pintura, etc." {...field} />
                </FormControl>
                <FormDescription>Descreva o motivo da manutenção.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Botão de Submissão */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {isPending ? "Salvando..." : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Cadastrar Sala
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
