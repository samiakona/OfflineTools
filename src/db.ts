import Dexie, { type Table } from 'dexie';

export interface CaseNote {
  id?: number;
  // Top metadata
  date: string;
  time: string;
  
  // People & Details
  childName: string;
  appointmentStatus: string;
  nextAppointmentDate?: string;
  nextAppointmentTime?: string;
  contactType: string;
  location: string;
  serviceType: string;
  additionalServices: string[]; // Multi-select array
  durationMinutes: number;
  caseName: string;

  // Notes & Narrative
  narrative: string;
  
  // Team
  teamMember: string;
  otherAttendees?: string;
  notifyTeam: boolean;
  isCompleted: boolean; // Mark as completed (Read Only lock)

  // Audit trailing
  createdBy: string;
  createdAt: number;
  updatedBy: string;
  updatedAt: number;
}

export class HemaiyaOfflineDatabase extends Dexie {
  caseNotes!: Table<CaseNote>;

  constructor() {
    super('HemaiyaOfflineDB');
    this.version(2).stores({
      caseNotes: '++id, date, serviceType, caseName, childName, createdAt'
    });
  }
}

export const db = new HemaiyaOfflineDatabase();