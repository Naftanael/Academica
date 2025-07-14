
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusCircle, HardDrive, Download, Trash2, RotateCcw } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Backup {
  name: string;
  size: number;
  createdAt: string;
}

export default function BackupPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchBackups = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/backups');
      const data = await response.json();
      setBackups(data);
    } catch (error) {
      toast({
        title: 'Erro ao buscar backups',
        description: 'Não foi possível carregar a lista de backups.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/backups/create', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Falha ao criar backup');
      }
      toast({
        title: 'Backup criado com sucesso!',
        description: `O arquivo de backup foi criado.`,
      });
      fetchBackups(); // Refresh the list
    } catch (error) {
      toast({
        title: 'Erro ao criar backup',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async (backupFile: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupFile }),
      });
      const result = await response.json();
       if (!response.ok) {
        throw new Error(result.error || 'Falha ao restaurar backup');
      }
      toast({
        title: 'Backup restaurado com sucesso!',
        description: `O backup do arquivo ${backupFile} foi restaurado.`,
      });
    } catch (error) {
       toast({
        title: 'Erro ao restaurar backup',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
    const handleDeleteBackup = async (backupFile: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/backups/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupFile }),
      });
      const result = await response.json();
       if (!response.ok) {
        throw new Error(result.error || 'Falha ao deletar backup');
      }
      toast({
        title: 'Backup deletado com sucesso!',
        description: `O arquivo de backup ${backupFile} foi deletado.`,
      });
      fetchBackups(); // Refresh the list
    } catch (error) {
       toast({
        title: 'Erro ao deletar backup',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Gerenciar Backups"
        description="Crie, visualize e restaure backups dos dados da sua aplicação."
        icon={HardDrive}
        actions={
          <Button onClick={handleCreateBackup} disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-4 w-4" />
            {isLoading ? 'Criando...' : 'Novo Backup'}
          </Button>
        }
      />
      <div className="space-y-8">
        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Backups ({backups.length})</CardTitle>
            <CardDescription>
              Aqui estão os backups dos seus dados. Você pode restaurar para um ponto anterior ou baixar um arquivo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {backups.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                 <HardDrive className="mx-auto h-16 w-16 mb-6 text-primary" />
                 <h3 className="text-xl font-semibold mb-2 text-foreground">Nenhum backup encontrado.</h3>
                 <p>Crie seu primeiro backup para garantir a segurança dos seus dados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Arquivo</TableHead>
                      <TableHead className="font-semibold">Tamanho</TableHead>
                      <TableHead className="font-semibold">Data de Criação</TableHead>
                      <TableHead className="text-right font-semibold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((backup) => (
                      <TableRow key={backup.name} className="hover:bg-muted/50">
                        <TableCell className="font-medium text-foreground">{backup.name}</TableCell>
                        <TableCell>{(backup.size / 1024).toFixed(2)} KB</TableCell>
                        <TableCell>
                          {format(new Date(backup.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleRestoreBackup(backup.name)} disabled={isLoading}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Restaurar
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                             <a href={`/api/backups/download?file=${backup.name}`} download>
                               <Download className="mr-2 h-4 w-4" />
                               Baixar
                             </a>
                          </Button>
                           <Button variant="destructive" size="sm" onClick={() => handleDeleteBackup(backup.name)} disabled={isLoading}>
                             <Trash2 className="mr-2 h-4 w-4" />
                             Deletar
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
