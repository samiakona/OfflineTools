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