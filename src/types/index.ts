
/**
 * A type representing the structure of a Firestore Timestamp object.
 * This is useful for type-checking data coming from Firestore before conversion.
 */
export interface FirestoreTimestamp {
  toDate: () => Date;
}

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
  subject: string;
  shift: PeriodOfDay;
  startDate: string | null; // Can be null if not set
  endDate: string | null; // Can be null if not set
  assignedClassroomId?: string;
  classDays: DayOfWeek[];
  notes?: string;
  status: ClassGroupStatus;
}

export interface ClassroomRecurringReservation {
  id:string;
  classGroupId: string;
  classroomId: string;
  startDate: string | null; // Can be null
  endDate: string | null; // Can be null
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

export type CategorizedClassGroups = Map<string, ClassGroupWithDates[]>;

export interface DashboardData {
  stats: DashboardStats;
  activeClassGroups: ClassGroupWithDates[];
  currentDate: string;
  classroomOccupancyChartData: DailyOccupancy[];
  categorizedActiveClassGroups?: CategorizedClassGroups;
}

// Type for Room Availability Display
export type OccupancyItem =
  | { type: 'class'; data: ClassGroup }
  | { type: 'recurring'; data: ClassroomRecurringReservation }
  | { type: 'event'; data: EventReservation };

// Type for TV Display data
export interface TvDisplayInfo {
  id: string;
  groupName: string;
  shift: PeriodOfDay;
  classroomName: string; // Should always be a string, e.g. "Sala 1" or "Não Atribuída"
  classDays: DayOfWeek[];
  startDate: string;
  endDate: string;
  status: ClassGroupStatus;
  classroomCapacity?: number;
  isUnderMaintenance?: boolean;
}

// Type for the published TV panel data file
export interface PublishedTvData {
  data: TvDisplayInfo[];
  publishedDate: string;
}

// Types for Announcements module
export type AnnouncementType = 'Notícia' | 'Comunicado';
export type AnnouncementPriority = 'Normal' | 'Urgente';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string; // ISO Date string
  type: AnnouncementType;
  priority: AnnouncementPriority;
  published: boolean;
}
