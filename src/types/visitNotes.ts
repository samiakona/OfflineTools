export interface VisitNotesData {
  id?: number;
  date: string;
  time: string;
  caseNumber: string;
  children: string;
  concernsAppointments: string;
  appointmentType: 'Email' | 'Face to Face' | 'letter' | 'N/A' | 'Note to file' | 'phone' | 'Stuffing' | 'Text' | 'Virtual';
  babyProgramsGrowth: string;
  schoolActivities: string;
  independentLivingSkills: string;
  purchasesForChild: string;
  familyVisitsSummary: string;
  childIssuesBehaviors: string;
  
  // Checkbox group for safety items
  safetyFireExtinguisher: boolean;
  safetySmokeDetectors: boolean;
  safetyCarbonDetector: boolean;
  safetyEmergencyNumbers: boolean;
  safetyFirstAidKit: boolean;
  safetyTwoFormsOfExit: boolean;
  safetyRunningHeatedWater: boolean;
  safetyWillingRespiteHome: boolean;
  
  childrenSleepLocation: string;
  medicationsStorage: string;
  cleanersStorage: string;
  contactInfoUpToDate: string;
  additionalComments: string;
  fosterCareAssistantSignature: string;
  isCompleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}