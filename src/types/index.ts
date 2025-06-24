export type DayOfWeek = 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo';
export type PeriodOfDay = 'Manhã' | 'Tarde' | 'Noite';

export interface Classroom {
  id: string;
  name: string;
  capacity?: number;
  resources: string[];
  isLab?: boolean;
  isUnderMaintenance?: boolean;
  maintenanceReason?: string;
}

export type ClassGroupStatus = 'Planejada' | 'Em Andamento' | 'Concluída' | 'Cancelada';

export interface ClassGroup {
  id: string;
  name: string;
  year: number;
  shift: PeriodOfDay;
  status: ClassGroupStatus;
  startDate: string; // ISO Date string
  endDate: string; // ISO Date string
  assignedClassroomId?: string;
  classDays: DayOfWeek[];
}

export interface ClassroomRecurringReservation {
  id: string;
  classGroupId: string;
  classroomId: string;
  startDate: string; // ISO Date string YYYY-MM-DD
  endDate: string; // ISO Date string YYYY-MM-DD
  shift: PeriodOfDay;
  purpose: string;
}

export interface EventReservation {
  id: string;
  classroomId: string;
  title: string;
  date: string; // ISO Date string YYYY-MM-DD
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  reservedBy: string;
  details?: string;
}

export interface DashboardStats {
  totalClassGroups: number;
  activeClassGroups: number;
  plannedClassGroups: number;
  totalClassrooms: number;
}

// New types for Dashboard
export interface ClassGroupWithDates extends ClassGroup {
  formattedStartDate: string;
  formattedEndDate: string;
  nearEnd: boolean;
}

export interface DailyOccupancy {
  day: string; // Abbreviation e.g. "Seg"
  day_full: string; // Full name e.g. "Segunda-feira"
  turmas: number;
}

export interface DashboardData {
  stats: DashboardStats;
  activeClassGroups: ClassGroupWithDates[];
  currentDate: Date;
  classroomOccupancyChartData: DailyOccupancy[];
}

// Type for Room Availability Display
export type OccupancyItem = 
  | { type: 'class'; data: ClassGroup }
  | { type: 'recurring'; data: ClassroomRecurringReservation }
  | { type: 'event'; data: EventReservation };

// Type for TV Display
export interface TvDisplayInfo {
  id: string;
  groupName: string;
  shift: string;
  classroomName: string | null;
}
