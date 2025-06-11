
export type DayOfWeek = 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo';
export type PeriodOfDay = 'Manhã' | 'Tarde' | 'Noite';

export interface Classroom {
  id: string;
  name: string;
  capacity?: number;
  resources: string[];
  isLab?: boolean; // Helper to identify labs easily
}

export interface Course { // Este é o tipo para "Disciplinas"
  id: string;
  name: string;
  workload: number; // Quantidade de aulas
  // appCursoId?: string; // This field is effectively orphaned or unused if AppCurso module is gone
}

// ClassGroupDiscipline interface removed as ClassGroup no longer tracks disciplines internally.

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
  // disciplines field removed for independence
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
