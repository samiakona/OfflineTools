import Dexie, { type Table } from 'dexie';
import type { CaseNote } from '../types/caseNote';
import type { AssessmentFormData } from '../types/assessment';
import type { VisitNotesData } from '../types/visitNotes';

export interface ThreatAssessment {
  id?: number;
  dateStarted: string;
  dateCompleted: string;
  presentDanger: string[];
  presentDangerComments: string;
  impendingDanger: string[];
  impendingDangerComments: string;
  alternativeIntervention: string[];
  alternativeInterventionComments: string;
  safetyThreshold: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentRecord extends AssessmentFormData {
  id?: number;
  caseName: string;
  childIsSafe: string;
}

export class HemaiyaOfflineDatabase extends Dexie {
  caseNotes!: Table<CaseNote>;
  assessments!: Table<AssessmentRecord>;
  threatAssessments!: Table<ThreatAssessment>;
  visitNotes!: Table<VisitNotesData>; // Visit Notes টেবিল

  constructor() {
    super('HemaiyaOfflineDB');
    
    // ভার্সন কন্ট্রোল এবং টেবিল স্কিমা ডেফিনিশন
    this.version(5).stores({
      caseNotes: '++id, date, serviceType, caseName, childName, createdAt',
      assessments: '++id, name, dateStarted, isCompleted',
      threatAssessments: '++id, dateStarted, dateCompleted, safetyThreshold, isCompleted, createdAt, updatedAt',
      homeStudyAssessments: '++id, caregiverId, assessmentDate, isCompleted',
      visitNotes: '++id, date, caseNumber, children, isCompleted' 
    });
  }
}

export const db = new HemaiyaOfflineDatabase();