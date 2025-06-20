
export type DayOfWeek = 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo';
export type PeriodOfDay = 'Manhã' | 'Tarde' | 'Noite';

export interface Classroom {
  id: string;
  name: string;
  capacity?: number;
  resources: string[];
  isLab?: boolean; // Helper to identify labs easily
  isUnderMaintenance?: boolean; // Indica se a sala está em manutenção
  maintenanceReason?: string; // Motivo da manutenção
}

export interface Course { // Este é o tipo para "Disciplinas"
  id: string;
  name: string;
  workload: number; // Quantidade de aulas
}

export type ClassGroupStatus = 'Planejada' | 'Em Andamento' | 'Concluída' | 'Cancelada';
// ClassGroupShift was identical to PeriodOfDay, consolidating to PeriodOfDay.

export interface ClassGroup {
  id: string;
  name: string;
  year: number;
  shift: PeriodOfDay; // Changed from ClassGroupShift
  status: ClassGroupStatus;
  startDate: string; // ISO Date string
  endDate: string; // ISO Date string
  assignedClassroomId?: string;
  classDays: DayOfWeek[];
}

// Represents recurring reservations made by a specific class group for a room
export interface ClassroomRecurringReservation {
  id: string;
  classGroupId: string;
  classroomId: string;
  startDate: string; // ISO Date string YYYY-MM-DD
  endDate: string; // ISO Date string YYYY-MM-DD
  shift: PeriodOfDay; 
  purpose: string;
}

// Represents ad-hoc, single instance event/room bookings
export interface EventReservation {
  id: string;
  classroomId: string;
  title: string; // Name of the event
  date: string; // ISO Date string YYYY-MM-DD
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  reservedBy: string; // Person or department reserving
  details?: string; // Optional additional details
}


export interface DashboardStats {
  totalClassGroups: number;
  activeClassGroups: number;
  plannedClassGroups: number;
  totalClassrooms: number;
}
