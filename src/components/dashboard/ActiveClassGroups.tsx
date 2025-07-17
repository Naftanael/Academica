
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CategorizedClassGroups, ClassGroupWithDates } from '@/types';

interface ActiveClassGroupsProps {
  categorizedClassGroups?: CategorizedClassGroups;
  totalActive: number;
}

function getShiftBadgeVariant(shift: string) {
  switch (shift) {
    case 'Manhã':
      return 'default';
    case 'Tarde':
      return 'secondary';
    case 'Noite':
      return 'outline';
    default:
      return 'destructive';
  }
}

export function ActiveClassGroups({
  categorizedClassGroups,
  totalActive,
}: ActiveClassGroupsProps) {
  if (!categorizedClassGroups || categorizedClassGroups.size === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Turmas Ativas ({totalActive})</CardTitle>
          <CardDescription>
            Não há turmas ativas no momento.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const categories = Array.from(categorizedClassGroups.keys());

  return (
    <Tabs defaultValue={categories[0]}>
      <TabsList>
        {categories.map(category => (
          <TabsTrigger key={category} value={category}>
            {category} ({categorizedClassGroups.get(category)?.length || 0})
          </TabsTrigger>
        ))}
      </TabsList>
      {categories.map(category => (
        <TabsContent key={category} value={category}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categorizedClassGroups.get(category)?.map(cg => (
              <Card key={cg.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{cg.name}</CardTitle>
                    <Badge variant={getShiftBadgeVariant(cg.shift)}>
                      {cg.shift}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {cg.shift}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <p>
                      <strong>Período:</strong> {cg.formattedStartDate} -{' '}
                      {cg.formattedEndDate}
                    </p>
                    <p>
                      <strong>Status:</strong>{' '}
                      <Badge
                        variant={
                          cg.nearEnd
                            ? 'destructive'
                            : cg.status === 'Em Andamento'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {cg.status}
                        {cg.nearEnd && ' (Próximo ao Fim)'}
                      </Badge>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
