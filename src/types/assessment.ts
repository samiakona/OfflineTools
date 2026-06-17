export interface AssessmentFormData {
  dateStarted: string;
  dateCompleted: string;
  name: string;
  relationship: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  hasHomeConcerns: 'Yes' | 'No';
  weapons: string[];
  livingSpace: string[];
  sanitation: string[];
  chemicals: string[];
  substanceUse: string[];
  climate: string[];
  homeConcernsExplanation: string;
  otherRiskIssues: 'Yes' | 'No';
  otherRiskExplanation: string;
  hasPhysicalConcerns: 'Yes' | 'No';
  physicalItems: string[];
  capacities: string[];
  abandonmentText: string;
  isCompleted: boolean;
  isChildSafeAtHome: boolean; // 👈 এই লাইন যোগ করুন
  caseNumber: string
}