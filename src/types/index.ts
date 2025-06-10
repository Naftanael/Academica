
export type DayOfWeek = 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo';
export type PeriodOfDay = 'Manhã' | 'Tarde' | 'Noite';

export interface Classroom {
  id: string;
  name: string;
  capacity?: number;
  resources: string[];
  isLab?: boolean; // Helper to identify labs easily
}

export interface Course {
  id: string;
  name: string;
  workload: number; // Quantidade de aulas
}

export interface ClassGroupDiscipline {
  courseId: string;
  completed: boolean;
  startDate?: string; // ISO Date string
  endDate?: string; // ISO Date string
}

export type ClassGroupStatus = 'Planejada' | 'Em Andamento' | 'Concluída' | 'Cancelada';
export type ClassGroupShift = 'Manhã' | 'Tarde' | 'Noite';

export interface ClassGroup {
  id: string;
  name: string;
  year: number;
  shift: ClassGroupShift;
  status: ClassGroupStatus;
  startDate: string; // ISO Date string
  endDate: string; // ISO Date string
  assignedClassroomId?: string;
  classDays: DayOfWeek[];
  disciplines: ClassGroupDiscipline[];
  courseId?: string; // ID do curso ao qual a turma pertence
}

export interface LabReservation {
  id: string;
  classroomId: string; // ID of the Lab/Special Room
  applicantName: string;
  reservationDate: string; // ISO Date string
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  purpose: string;
}

export interface DashboardStats {
  totalClassGroups: number;
  activeClassGroups: number;
  plannedClassGroups: number;
  totalClassrooms: number;
}

