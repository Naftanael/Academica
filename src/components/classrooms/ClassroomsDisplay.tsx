// src/components/classrooms/ClassroomsDisplay.tsx
'use client';

import type { Classroom } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Wrench } from "lucide-react";
import EditClassroomButton from "./EditClassroomButton";
import DeleteClassroomButton from "./DeleteClassroomButton";

interface ClassroomsDisplayProps {
  classrooms: Classroom[];
}

/**
 * A client component to display a list of classrooms in a grid of cards.
 * @param {ClassroomsDisplayProps} props - The properties for the component.
 */
export default function ClassroomsDisplay({ classrooms }: ClassroomsDisplayProps) {
  if (classrooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center h-80">
        <h3 className="text-xl font-bold tracking-tight text-foreground">
          Nenhuma sala de aula encontrada
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Comece adicionando uma nova sala de aula para visualizá-la aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {classrooms.map((classroom) => (
        <Card key={classroom.id} className="flex flex-col shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg font-bold font-headline">{classroom.name}</CardTitle>
              {classroom.isUnderMaintenance ? (
                <Badge variant="destructive" className="bg-amber-500 text-white">
                    <Wrench className="mr-1.5 h-3 w-3"/>
                    Manutenção
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">Disponível</Badge>
              )}
            </div>
            {classroom.capacity && (
                <CardDescription className="flex items-center pt-1">
                    <Users className="mr-2 h-4 w-4" />
                    Capacidade: {classroom.capacity} alunos
                </CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex-grow">
            {classroom.isUnderMaintenance && classroom.maintenanceReason && (
              <p className="rounded-md bg-amber-100 dark:bg-amber-900/50 p-3 text-sm text-amber-800 dark:text-amber-200">
                <strong>Motivo:</strong> {classroom.maintenanceReason}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-2 bg-muted/50 p-3 rounded-b-lg">
              <EditClassroomButton classroomId={classroom.id} />
              <DeleteClassroomButton classroomId={classroom.id} />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}