// src/components/classrooms/ClassroomsDisplay.tsx
'use client';

import type { Classroom } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import EditClassroomButton from "./EditClassroomButton";
import DeleteClassroomButton from "./DeleteClassroomButton";

interface ClassroomsDisplayProps {
  classrooms: Classroom[];
}

/**
 * A client component to display a list of classrooms.
 * It receives the classroom data as props and is responsible for rendering the UI.
 * @param {ClassroomsDisplayProps} props - The properties for the component.
 */
export default function ClassroomsDisplay({ classrooms }: ClassroomsDisplayProps) {
  if (classrooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <h3 className="text-xl font-bold tracking-tight text-gray-900">
          Nenhuma sala de aula encontrada
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Comece adicionando uma nova sala de aula.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {classrooms.map((classroom) => (
        <Card key={classroom.id}>
          <CardHeader>
            <CardTitle>{classroom.name}</CardTitle>
            <CardDescription>Capacidade: {classroom.capacity} alunos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {classroom.isUnderMaintenance ? (
              <p className="rounded-md bg-yellow-100 p-3 text-sm text-yellow-800">
                <strong>Em manutenção:</strong> {classroom.maintenanceReason}
              </p>
            ) : (
              <p className="text-sm text-green-600">Disponível</p>
            )}
            <div className="flex justify-end space-x-2">
              <EditClassroomButton classroomId={classroom.id} />
              <DeleteClassroomButton classroomId={classroom.id} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
