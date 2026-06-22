// types/caseNote.ts
export interface CaseNote {
  id?: number;
  date: string;
  time: string;
  childName: string;
  appointmentStatus: string;
  nextAppointmentDate?: string;
  nextAppointmentTime?: string;
  contactType: string;
  location: string;
  serviceType: string;
  additionalServices: string[];
  durationMinutes: number;
  caseName: string;
  narrative: string;
  teamMember?: string; // ✅ Optional করে দিন
  otherAttendees?: string;
  notifyTeam: boolean;
  isCompleted: boolean;
  createdBy: string;
  createdAt: number;
  updatedBy: string;
  updatedAt: number;
  clientType?: string;
  clientId?: string;
  clientName?: string;
  parentNames?: string[];
  childNames?: string[];
  caseId?: string;
}

// ফর্ম ডেটার জন্য আলাদা টাইপ
export interface CaseNoteFormData {
  date: string;
  time: string;
  childName: string;
  appointmentStatus: string;
  nextAppointmentDate?: string;
  nextAppointmentTime?: string;
  contactType: string;
  location: string;
  serviceType: string;
  additionalServices: string[];
  durationMinutes: number;
  caseName: string;
  narrative: string;
  teamMember?: string;
  otherAttendees?: string;
  notifyTeam: boolean;
  isCompleted: boolean;
  clientType: string;
  clientId?: string;
  clientName?: string;
  selectedCase?: string;
  parentNames?: string[];
  childNames?: string[];
  caseId?: string;
}

export interface CasePerson {
  id: string | number;
  name: string;
}

export interface CaseData {
  id: string;
  caseName: string;
  parents: CasePerson[];
  children: CasePerson[];
  isGroup: boolean;
}