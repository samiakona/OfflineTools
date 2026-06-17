// services/assessmentApiForLive.ts

// 🔧 API Configuration - Developer শুধু এই URL পরিবর্তন করবে
const API_BASE_URL = 'http://localhost:5096/api';

// 🎭 Mock Mode - true হলে রিয়েল API কল না করে Mock ডেটা দেখাবে
const USE_MOCK_MODE = true; // Developer চাইলে false করে দিবে

export interface SyncResponse {
  success: boolean;
  message: string;
  syncedId?: number;
  caseNumber?: string;
  data?: any;
}

// Helper: State Lookup ID
const getStateLookupId = (state: string): number => {
  const mapping: Record<string, number> = {
    'CA': 1, 'NY': 2, 'TX': 3, 'FL': 4, 'IL': 5,
    'PA': 6, 'OH': 7, 'GA': 8, 'NC': 9, 'MI': 10,
  };
  return mapping[state] || 1;
};

// Helper: Relationship Lookup ID
const getRelationshipLookupId = (relationship: string): number => {
  const mapping: Record<string, number> = {
    'Mother': 1, 'Father': 2, 'Guardian': 3, 'Other': 4,
  };
  return mapping[relationship] || 3;
};

// Helper: County Lookup ID
const getCountyLookupId = (county: string): number => {
  const mapping: Record<string, number> = {
    'County A': 1, 'County B': 2,
  };
  return mapping[county] || 0;
};

// 📤 Payload Builder Function - আপনার দেওয়া JSON Structure অনুযায়ী
const buildAssessmentPayload = (safeData: any, caseNumber: string) => {
  return {
    id: safeData.id || 0,
    recordedBy: safeData.recordedBy || 'Kona_Supervisor',
    recordedOn: safeData.recordedOn || new Date().toISOString(),
    createdBy: safeData.createdBy || 'Kona_Supervisor',
    createdOn: safeData.createdOn || new Date().toISOString(),
    caseNumber: caseNumber,
    
    assessmentStartedDate: safeData.assessmentStartedDate || safeData.dateStarted || new Date().toISOString().split('T')[0],
    assessmentCompletedDate: safeData.assessmentCompletedDate || safeData.dateCompleted || '',
    homeName: safeData.homeName || safeData.name || '',
    relationshipLookupId: safeData.relationshipLookupId || getRelationshipLookupId(safeData.relationship || 'Guardian'),
    
    address: safeData.address || '',
    city: safeData.city || '',
    stateLookupId: safeData.stateLookupId || getStateLookupId(safeData.state || 'CA'),
    zip: safeData.zip || '',
    communityLookupId: safeData.communityLookupId || 1,
    countyLookupId: safeData.countyLookupId || getCountyLookupId(safeData.county || 'County A'),
    
    areThereConcernsInTheHome: safeData.areThereConcernsInTheHome || false,
    weaponInHome: safeData.weaponInHome || false,
    weaponAccessible: safeData.weaponAccessible || false,
    gunsAndAmmunitionNotStoredProperly: safeData.gunsAndAmmunitionNotStoredProperly || false,
    noConcernsForAccessToWeapons: safeData.noConcernsForAccessToWeapons || false,
    
    inadequateSleepingArrangements: safeData.inadequateSleepingArrangements || false,
    childDoesNotHaveOwnSpace: safeData.childDoesNotHaveOwnSpace || false,
    noConcernsForChildLivingSpace: safeData.noConcernsForChildLivingSpace || false,
    
    trashPiledUpInsideOrOutsideHome: safeData.trashPiledUpInsideOrOutsideHome || false,
    clutterInsideTheHome: safeData.clutterInsideTheHome || false,
    animalFecesWithinHome: safeData.animalFecesWithinHome || false,
    insectsWithinHome: safeData.insectsWithinHome || false,
    foodIsNotStoredProperly: safeData.foodIsNotStoredProperly || false,
    noConcernsForSanitation: safeData.noConcernsForSanitation || false,
    
    poisonsNotStoredProperly: safeData.poisonsNotStoredProperly || false,
    sharpObjectsNotStoredProperly: safeData.sharpObjectsNotStoredProperly || false,
    smallObjectsWithinReach: safeData.smallObjectsWithinReach || false,
    noConcernsForAccessToChemicals: safeData.noConcernsForAccessToChemicals || false,
    
    signsOfExcessiveAlcohol: safeData.signsOfExcessiveAlcohol || false,
    medicationsNotStoredProperly: safeData.medicationsNotStoredProperly || false,
    alcoholAndCigarettesNotOutOfReach: safeData.alcoholAndCigarettesNotOutOfReach || false,
    noConcernsForSignsOfSubstanceUseOrAbuse: safeData.noConcernsForSignsOfSubstanceUseOrAbuse || false,
    
    violenceInHomeOrNeighborhood: safeData.violenceInHomeOrNeighborhood || false,
    trafficInAndOutOfTheHome: safeData.trafficInAndOutOfTheHome || false,
    levelOfSupport: safeData.levelOfSupport || false,
    inaccessibilityOfTransportation: safeData.inaccessibilityOfTransportation || false,
    accessibilityOfCommunication: safeData.accessibilityOfCommunication || false,
    noConcernsForClimateOfNeighborhoodOrHome: safeData.noConcernsForClimateOfNeighborhoodOrHome || false,
    
    otherConcernsInHome: safeData.otherConcernsInHome || null,
    
    physicalStatusOfHomeConcers: safeData.physicalStatusOfHomeConcers || false,
    exposedElectricalWires: safeData.exposedElectricalWires || false,
    exposedOutlets: safeData.exposedOutlets || false,
    brokenWindows: safeData.brokenWindows || false,
    noRunningWater: safeData.noRunningWater || false,
    scaldingWater: safeData.scaldingWater || false,
    standingWater: safeData.standingWater || false,
    noPower: safeData.noPower || false,
    inadequateHeatingOrCoolingSystem: safeData.inadequateHeatingOrCoolingSystem || false,
    noSmokeMonoxideDetectors: safeData.noSmokeMonoxideDetectors || false,
    stairsAreNotSecured: safeData.stairsAreNotSecured || false,
    lackOfbarriersOnStairsPorchesAndWindows: safeData.lackOfbarriersOnStairsPorchesAndWindows || false,
    holesInFloorOrWalls: safeData.holesInFloorOrWalls || false,
    cordsOnBlindsAndCurtainsNotOutofReach: safeData.cordsOnBlindsAndCurtainsNotOutofReach || false,
    moldOrMildewInTheHome: safeData.moldOrMildewInTheHome || false,
    septicProblems: safeData.septicProblems || false,
    othePhysicalStatusOfHomeConcerns: safeData.othePhysicalStatusOfHomeConcerns || null,
    explainAnyOfPhysicalStatusOfHomeMarked: safeData.explainAnyOfPhysicalStatusOfHomeMarked || null,
    
    otheRiskIssuesInHome: safeData.otheRiskIssuesInHome || false,
    otheRiskIssuesInHomeExplaintion: safeData.otheRiskIssuesInHomeExplaintion || null,
    abandonmentORAggravatedCircumstances: safeData.abandonmentORAggravatedCircumstances || null,
    
    isThereNeedForCustody: safeData.isThereNeedForCustody || false,
    isChildSafeAtHome: safeData.isChildSafeAtHome || false,
    safetyPlanCreated: safeData.safetyPlanCreated || false,
    
    recognizesThreats: safeData.recognizesThreats || false,
    canArticulateplanToProtectTheChild: safeData.canArticulateplanToProtectTheChild || false,
    demonstratesProtectiveRoleAndResponsibilities: safeData.demonstratesProtectiveRoleAndResponsibilities || false,
    recognizesTheChildsNeeds: safeData.recognizesTheChildsNeeds || false,
    expressesEmpathySensitivityForTheChild: safeData.expressesEmpathySensitivityForTheChild || false,
    hasKnowledgeToProtectTheChild: safeData.hasKnowledgeToProtectTheChild || false,
    caretakerProcessesExternalWorld: safeData.caretakerProcessesExternalWorld || false,
    hasCapacityToLearn: safeData.hasCapacityToLearn || false,
    isEmotionallyAbleToInterveneAndProtect: safeData.isEmotionallyAbleToInterveneAndProtect || false,
    isResilientAsCaregiver: safeData.isResilientAsCaregiver || false,
    isAdaptiveAsCaregiver: safeData.isAdaptiveAsCaregiver || false,
    setsAsideNeedsForChild: safeData.setsAsideNeedsForChild || false,
    demonstratesTolerance: safeData.demonstratesTolerance || false,
    demonstratesEmotionalControl: safeData.demonstratesEmotionalControl || false,
    isPhysicallyAbleToProtect: safeData.isPhysicallyAbleToProtect || false,
    caregiverAndChildHaveStrongEmotional: safeData.caregiverAndChildHaveStrongEmotional || false,
    
    isCompleted: safeData.isCompleted || false,
    isDeleted: safeData.isDeleted || false
  };
};

// 🎭 Mock Sync Function - কনসোলে Payload দেখাবে
const mockSyncAssessment = async (caseNumber: string, assessmentData: any): Promise<SyncResponse> => {
  console.log('🎭 ===== MOCK SYNC STARTED =====');
  console.log('📌 Case Number:', caseNumber);
  console.log('📦 Assessment Data:', assessmentData);
  
  // Build payload
  const payload = buildAssessmentPayload(assessmentData, caseNumber);
  
  console.log('📤 ===== COMPLETE PAYLOAD =====');
  console.log(JSON.stringify(payload, null, 2));
  console.log('📤 ===== PAYLOAD END =====');
  
  // Mock delay (simulate network)
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock success response
  return {
    success: true,
    message: '✅ Assessment synced successfully (MOCK MODE)',
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
export const checkAssessmentAPIHealth = async (): Promise<boolean> => {
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

// 📤 Main Sync Function - এটাই কল হবে Push করলে
export const syncAssessment = async (caseNumber: string, assessmentData: any): Promise<SyncResponse> => {
  // 🎭 If Mock Mode is enabled, use mock
  if (USE_MOCK_MODE) {
    return await mockSyncAssessment(caseNumber, assessmentData);
  }
  
  // 🌐 Real API Call
  try {
    const safeData = assessmentData || {};
    const encodedCaseNumber = encodeURIComponent(caseNumber || 'DEFAULT-CASE');
    const url = `${API_BASE_URL}/sync?caseNumber=${encodedCaseNumber}`;
    
    console.log('🔄 Syncing assessment for case:', caseNumber);
    console.log('📡 API URL:', url);
    
    const payload = buildAssessmentPayload(safeData, caseNumber);
    
    console.log('📤 Final Assessment Payload:', JSON.stringify(payload, null, 2));

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
      message: result.message || 'Assessment synced successfully',
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
export const syncMultipleAssessments = async (assessments: any[]): Promise<{
  success: boolean;
  results: Array<{ caseNumber: string; success: boolean; error?: string }>;
  totalSynced: number;
}> => {
  try {
    const results = [];
    let successCount = 0;

    for (const assessment of assessments) {
      const caseNumber = assessment.caseNumber || 'DEFAULT-CASE';
      const result = await syncAssessment(caseNumber, assessment);
      
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
export const getConfig = () => ({
  apiBaseUrl: API_BASE_URL,
  mockMode: USE_MOCK_MODE,
});