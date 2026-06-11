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
  teamMember: string;
  otherAttendees?: string;
  notifyTeam: boolean;
  isCompleted: boolean;
  createdBy: string;
  createdAt: number;
  updatedBy: string;
  updatedAt: number;
  // নতুন ফিল্ড
  clientType?: string;      // '0'=Child, '1'=Parent, '2'=Other, '3'=Group
  clientId?: string;
  clientName?: string;      // Selected child/parent name
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
  teamMember: string;
  otherAttendees?: string;
  notifyTeam: boolean;
  isCompleted: boolean;
  // নতুন ফিল্ড (শুধু ফর্মের জন্য)
  clientType?: string;
  clientId?: string;
  clientName?: string;
}