export interface HomeStudyAssessmentData {
  id?: number; // Dexie auto-increment করবে
  assessmentDate: string;
  assessmentTime: string;
  caregiverId: string;
  caregiverName: string;
  contacts: string;
  sourceOfReferral: string;
  directionsToHome: string;
  motivationForTakingChild: string;
familyName: string;
caregiverFirstName: string;
  caregiverLastName: string;
  // Family History
  bornAndRaised: string;
  parentsDetails: string;
  siblingsDetails: string;
  siblingsRelationship: string;
  howRaised: string;
  conflictResolution: string;
  familyActivities: string;
  
  // Self Description
  selfDescription: string;
  strengthsWeaknesses: string;
  dealWithStress: string;
  thingsUpsetYou: string;
  
  // Education
  highSchool: string;
  importanceOfEducation: string;
  newParentingSkills: string;
  
  // Work Experience
  currentOccupation: string;
  careerPlans: string;
  workExperiencePrep: string;
  
  // Children
  describeChildren: string;
  treatFosterChild: string;
  
  // Parenting
  parentWellThings: string;
  parentImproveThings: string;
  parentUpsetThings: string;
  experiencesInsideHome: string;
  familyRules: string;
  
  // Discipline
  disciplineOwnChildren: string;
  physicalDisciplineThoughts: string;
  
  // Chemical Use
  chemicalUseDescription: string;
  acceptableAlcoholUse: string;
  familyChemicalProblem: string;
  
  // Ethical and Spiritual
  spiritualityCultureRole: string;
  childBeliefsDiffer: string;
  childPersonalBeliefsDiffer: string;
  
  // Finances
  moneyHandled: string;
  financialPicture: string;
  
  isCompleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}