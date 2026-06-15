import Dexie, { type Table } from 'dexie';
import type { CaseNote } from '../types/caseNote';
import type { AssessmentFormData } from '../types/assessment';

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

  constructor() {
    super('HemaiyaOfflineDB');
    this.version(4).stores({
      caseNotes: '++id, date, serviceType, caseName, childName, createdAt',
      assessments: '++id, name, dateStarted, isCompleted',
      threatAssessments: '++id, dateStarted, dateCompleted, safetyThreshold, isCompleted, createdAt, updatedAt',
      homeStudyAssessments: '++id, caregiverId, assessmentDate, isCompleted'
    });
  }
}

export const db = new HemaiyaOfflineDatabase();