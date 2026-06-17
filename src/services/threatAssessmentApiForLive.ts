// services/threatAssessmentApiForLive.ts

// 🔧 API Configuration - Developer শুধু এই URL পরিবর্তন করবে
const API_BASE_URL = 'http://localhost:5096/api';

// 🎭 Mock Mode - true হলে রিয়েল API কল না করে Mock ডেটা দেখাবে
const USE_MOCK_MODE = true; // Developer চাইলে false করে দিবে

export interface ThreatSyncResponse {
  success: boolean;
  message: string;
  syncedId?: number;
  caseNumber?: string;
  data?: any;
}

// Helper: Safety Threshold Lookup ID
const getSafetyThresholdLookupId = (threshold: string): number => {
  const mapping: Record<string, number> = {
    'Severe Consequences For The Child': 1,
    'Immediate Or Will Occur In Near Future': 2,
    'Vulnerabilty': 3,
    'Out-Of-Control: No Adult In Household To Prevent': 4,
    'Behaviors, Conditions Are Specific, Observable And Clearly Understood': 5
  };
  return mapping[threshold] || 2;
};

// 📤 Payload Builder Function
const buildThreatPayload = (safeData: any, caseNumber: string) => {
  // Helper to check if item exists in array
  const hasItem = (array: string[] | undefined, item: string) => {
    return array?.includes(item) || false;
  };

  return {
    id: safeData.id || 0,
    caseId: safeData.caseId || 0,
    recordedBy: safeData.recordedBy || 'Kona_Supervisor',
    recordedOn: safeData.recordedOn || new Date().toISOString(),
    createdBy: safeData.createdBy || 'Kona_Supervisor',
    createdOn: safeData.createdOn || new Date().toISOString(),
    caseNumber: caseNumber,
    
    startedDate: safeData.startedDate || safeData.dateStarted || new Date().toISOString().split('T')[0],
    completedDate: safeData.completedDate || safeData.dateCompleted || null,
    
    // Present Danger - General
    extremeMaltreatmentSuspected: hasItem(safeData.presentDanger, "Severe, extreme maltreatment suspected, observed or confirmed"),
    multipleInjuries: hasItem(safeData.presentDanger, "Child has multiple or different kinds of injuries"),
    injuriesToFace: hasItem(safeData.presentDanger, "Child has injuries to face or head"),
    maltreatmentDemonstratesBizarreCruelty: hasItem(safeData.presentDanger, "Maltreatment demonstrates bizarre cruelty"),
    malreatmentOfSeveralVictims: hasItem(safeData.presentDanger, "Maltreatment of several victims suspected, observed or confirmed"),
    maltreatmentAppearsPremeditated: hasItem(safeData.presentDanger, "Maltreatment appears premeditated"),
    lifeThreatening: hasItem(safeData.presentDanger, "Dangerous (life threatening) living arrangements"),
    seriousThreatWithHistory: hasItem(safeData.presentDanger, "Current report represents a serious threat and there is a history of referrals"),
    childIsAccessibleToPersonMaltreatedChild: hasItem(safeData.presentDanger, "Child is accessible to person alleged to have maltreated the child"),
    
    // Present Danger - Child Context
    parentViewpointOfChildIsBizarre: hasItem(safeData.presentDanger, "Parent's viewpoint of child is bizarre"),
    childUnableToCareForSelf: hasItem(safeData.presentDanger, "Child is unable to care for self and unsupervised or alone at time of referral"),
    childNeedsMedicalAttention: hasItem(safeData.presentDanger, "Child needs medical attention at time of referral"),
    childFearfulOAnxiousOfHome: hasItem(safeData.presentDanger, "Child is profoundly fearful or anxious of home situation at time of referral"),
    
    // Present Danger - Parent Context
    parentIsIntoxicated: hasItem(safeData.presentDanger, "Parent is intoxicated now or consistently under the influence"),
    parentOutOfControl: hasItem(safeData.presentDanger, "Parent is out of control (mental illness or other significant lack of control)"),
    parentsUnableToBasicCare: hasItem(safeData.presentDanger, "Parents unable or unwilling to perform basic care"),
    parentIsActingDangerous: hasItem(safeData.presentDanger, "Parent is acting dangerous now or is described as dangerous"),
    parentsWhereaboutsUnknown: hasItem(safeData.presentDanger, "Parents' whereabouts are unknown"),
    oneOrBothParentsRejectIntervention: hasItem(safeData.presentDanger, "One or both parents overtly reject intervention"),
    caregiversNotExplainThwChildInjuries: hasItem(safeData.presentDanger, "Both parents/caregivers cannot or do not explain the child's injuries and/or conditions"),
    
    // Present Danger - Family Context
    theFamilyMayFlee: hasItem(safeData.presentDanger, "The family may flee"),
    theFamilyHidesTheChild: hasItem(safeData.presentDanger, "The family hides the child"),
    childSubjectToDomesticViolence: hasItem(safeData.presentDanger, "Child is subject to present/active domestic violence"),
    familyIsIsolated: hasItem(safeData.presentDanger, "Family is isolated and there is a report of serious maltreatment"),
    situationChangeQuicklyAndSseriousMaltreatment: hasItem(safeData.presentDanger, "Situation may/will change quickly and there is a report of serious maltreatment"),
    
    presentDangerComments: safeData.presentDangerComments || null,
    
    // Impending Danger
    noAdultInTheHome: hasItem(safeData.impendingDanger, "No adult in the home will perform parental duties and responsibilities"),
    parentsAreViolent: hasItem(safeData.impendingDanger, "One or both parents are violent"),
    parentsCannotControlBehavior: hasItem(safeData.impendingDanger, "One or both parents cannot control behavior"),
    childIsPerceivedInExtremelyNegativeTermsByParent: hasItem(safeData.impendingDanger, "Child is perceived in extremely negative terms by one or both parents/caregivers"),
    familyDoesNotHaveResourcesToMeetBasicNeeds: hasItem(safeData.impendingDanger, "Family does not have resources to meet basic needs"),
    parentsCaregiversFearTheyWillMaltreatChild: hasItem(safeData.impendingDanger, "One or both parents/caregivers fear they will maltreat child and/or request placement"),
    parentsOrCaregiversIntendToHurtChild: hasItem(safeData.impendingDanger, "One or both parents/caregivers intend(ed) to hurt child"),
    parentsOrCaregiversLackParentingKnowledge: hasItem(safeData.impendingDanger, "One or both parents/caregivers lack parenting knowledge, skills, or motivation which affects child safety"),
    parentsOrCaregiversWillFlee: hasItem(safeData.impendingDanger, "There some indication that parents/caregivers will flee"),
    childHasExceptionalNeedsParentsCantMeet: hasItem(safeData.impendingDanger, "Child has exceptional needs which the parents/caregivers cannot or will not meet"),
    livingArrangementsSeriouslyEndanger: hasItem(safeData.impendingDanger, "Living arrangements seriously endanger child's physical health"),
    childShowsSeriousEmotionalEffectsOfMaltreament: hasItem(safeData.impendingDanger, "Child shows serious emotional effects of maltreatment and a lack of behavioral control"),
    childShowsSeriousPhysicalEffectsOfMaltreatment: hasItem(safeData.impendingDanger, "Child shows serious physical effects of maltreatment"),
    childIsFearfulOfTheHomeSituation: hasItem(safeData.impendingDanger, "Child is fearful of the home situation"),
    hildIsSeenByEitherParentCaregiverAsbeingResponsibleForParentsOrCaregiversProblems: hasItem(safeData.impendingDanger, "Child is seen by either parent/caregiver as being responsible for parents/caregivers problems"),
    theMaltreatingParentCaregiverExhibitsNoRemorseOrGuilt: hasItem(safeData.impendingDanger, "The maltreating parent/caregiver exhibits no remorse or guilt"),
    parentsOrCaregiversHaveFailedToBenefitFromPreviousProfessionalHelp: hasItem(safeData.impendingDanger, "One or both parents/caregivers have failed to benefit from previous professional help"),
    
    impendingDangerComments: safeData.impendingDangerComments || null,
    
    // Alternative Intervention
    failureToProvideMedicalTreatment: hasItem(safeData.alternativeIntervention, "Failure to provide medical treatment for a non-emergent, minor discomfort, illness for the child."),
    potentialSafetyConcernsInAndAroundHome: hasItem(safeData.alternativeIntervention, "Potential safety concerns in and around the home."),
    casesOfheadLicescabiesAndEtc: hasItem(safeData.alternativeIntervention, "Reoccurring / Ongoing cases of head lice, scabies, etc."),
    suddenDeclineOrMinorBehavioralProblems: hasItem(safeData.alternativeIntervention, "Sudden decline in child's normal behaviors or displays minor behavioral problems, physical, mental, or social concerns."),
    complaintAboutChildHygiene: hasItem(safeData.alternativeIntervention, "Complaint about child's hygiene have been made by others (school, etc.), child may emit body odor or mouth odor or peers will not play with child."),
    failureToProvideClothingShelterOrNutrition: hasItem(safeData.alternativeIntervention, "Failure to provide adequate clothing, shelter, or nutrition that does not present an immediate safety or health issue to the child."),
    childOrFamilyWouldBenefitFromAdditionalResources: hasItem(safeData.alternativeIntervention, "Child/Family would benefit from additional resources and might not be receiving such services."),
    familyReportsTroubleAccessingResources: hasItem(safeData.alternativeIntervention, "Family reports trouble accessing resources, supports, etc."),
    familyReportsInsufficientResources: hasItem(safeData.alternativeIntervention, "Family reports insufficient resources and supports resulting in child's well-being concerns."),
    
    alternativeInterventionComments: safeData.alternativeInterventionComments || null,
    
    safetyThresholdLookupId: getSafetyThresholdLookupId(safeData.safetyThreshold || ''),
    isCompleted: safeData.isCompleted || false,
    isDeleted: safeData.isDeleted || false
  };
};

// 🎭 Mock Sync Function
const mockSyncThreatAssessment = async (caseNumber: string, assessmentData: any): Promise<ThreatSyncResponse> => {
  console.log('🎭 ===== MOCK THREAT SYNC STARTED =====');
  console.log('📌 Case Number:', caseNumber);
  console.log('📦 Assessment Data:', assessmentData);
  
  // Build payload
  const payload = buildThreatPayload(assessmentData, caseNumber);
  
  console.log('📤 ===== COMPLETE THREAT PAYLOAD =====');
  console.log(JSON.stringify(payload, null, 2));
  console.log('📤 ===== PAYLOAD END =====');
  
  // Mock delay (simulate network)
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock success response
  return {
    success: true,
    message: '✅ Threat Assessment synced successfully (MOCK MODE)',
    syncedId: Math.floor(Math.random() * 10000),
    caseNumber: caseNumber,
    data: {
      ...payload,
      syncedAt: new Date().toISOString(),
      mockMode: true
    }
  };
};

// 🌐 Real API Health Check
export const checkThreatAPIHealth = async (): Promise<boolean> => {
  if (USE_MOCK_MODE) {
    console.log('🎭 MOCK: API Health Check - Always Online');
    return true;
  }
  
  try {
    console.log(`🔍 Checking API health at: ${API_BASE_URL}/sync`);
    const response = await fetch(`${API_BASE_URL}/sync`, {
      method: 'HEAD',
      cache: 'no-cache',
    });
    console.log(`✅ API health check response: ${response.status}`);
    return response.ok;
  } catch (error) {
    console.error('❌ API health check failed:', error);
    return false;
  }
};

// 📤 Main Sync Function
export const syncThreatAssessment = async (caseNumber: string, assessmentData: any): Promise<ThreatSyncResponse> => {
  // 🎭 If Mock Mode is enabled, use mock
  if (USE_MOCK_MODE) {
    return await mockSyncThreatAssessment(caseNumber, assessmentData);
  }
  
  // 🌐 Real API Call
  try {
    const safeData = assessmentData || {};
    const encodedCaseNumber = encodeURIComponent(caseNumber || 'DEFAULT-CASE');
    const url = `${API_BASE_URL}/sync?caseNumber=${encodedCaseNumber}`;
    
    console.log('🔄 Syncing threat assessment for case:', caseNumber);
    console.log('📡 API URL:', url);
    
    const payload = buildThreatPayload(safeData, caseNumber);
    
    console.log('📤 Final Threat Assessment Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('📡 Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Sync Response:', result);
    
    return {
      success: true,
      message: result.message || 'Threat Assessment synced successfully',
      syncedId: result.id || result.syncedId,
      caseNumber: caseNumber,
      data: result
    };
    
  } catch (error: any) {
    console.error('❌ Sync error:', error);
    return {
      success: false,
      message: error.message || 'Network error',
      caseNumber: caseNumber
    };
  }
};

// 📤 Bulk Sync Function
export const syncMultipleThreatAssessments = async (assessments: any[]): Promise<{
  success: boolean;
  results: Array<{ caseNumber: string; success: boolean; error?: string }>;
  totalSynced: number;
}> => {
  try {
    const results = [];
    let successCount = 0;

    for (const assessment of assessments) {
      const caseNumber = assessment.caseNumber || 'DEFAULT-CASE';
      const result = await syncThreatAssessment(caseNumber, assessment);
      
      results.push({
        caseNumber: caseNumber,
        success: result.success,
        error: result.success ? undefined : result.message
      });
      
      if (result.success) successCount++;
    }

    console.log(`📊 Bulk Sync Complete: ${successCount}/${assessments.length} synced`);
    
    return {
      success: successCount === assessments.length,
      results: results,
      totalSynced: successCount
    };
  } catch (error: any) {
    console.error('❌ Bulk sync error:', error);
    return {
      success: false,
      results: [],
      totalSynced: 0
    };
  }
};

// 📌 Export configuration info
export const getThreatConfig = () => ({
  apiBaseUrl: API_BASE_URL,
  mockMode: USE_MOCK_MODE,
});