
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
}

// Represents ad-hoc, single instance lab/room bookings
export interface LabReservation {
  id: string;
  classroomId: string; // ID of the Lab/Special Room
  applicantName: string; // Could be professor name, department, etc.
  reservationDate: string; // ISO Date string YYYY-MM-DD
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  purpose: string;
}

// Represents recurring reservations made by a specific class group for a room
export interface ClassroomRecurringReservation {
  id: string;
  classGroupId: string;
  classroomId: string;
  startDate: string; // ISO Date string YYYY-MM-DD
  endDate: string; // ISO Date string YYYY-MM-DD
  shift: PeriodOfDay; // Replaces startTime and endTime
  purpose: string;
}


export interface DashboardStats {
  totalClassGroups: number;
  activeClassGroups: number;
  plannedClassGroups: number;
  totalClassrooms: number;
}

