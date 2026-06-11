import Dexie, { type Table } from 'dexie';
import type { CaseNote } from '../types/caseNote';
import type { AssessmentFormData } from '../types/assessment';
// ইডিট করার সুবিধার জন্য আইডিসহ একটি ইন্টারফেস তৈরি করুন
export interface AssessmentRecord extends AssessmentFormData{
  id?: number;
  caseName: string;
  childIsSafe: string;
}

export class HemaiyaOfflineDatabase extends Dexie {
  caseNotes!: Table<CaseNote>;
assessments!: Table<AssessmentRecord>; // 🌟 একই ডিবিতে নতুন টেবিল
  constructor() {
    super('HemaiyaOfflineDB');
    this.version(2).stores({
      caseNotes: '++id, date, serviceType, caseName, childName, createdAt',
      assessments: '++id, name, dateStarted, isCompleted' // 🌟 নতুন টেবিল ইনডেক্স
    });
  }
}

export const db = new HemaiyaOfflineDatabase();