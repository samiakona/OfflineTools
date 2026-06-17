// services/assessmentApiForLive.ts

// 🔧 API Configuration - Developer শুধু এই URL পরিবর্তন করবে
const API_BASE_URL = 'https://localhost:44361/api/OfflineSync';

// 🎭 Mock Mode - true হলে রিয়েল API কল না করে Mock ডেটা দেখাবে
const USE_MOCK_MODE = false; // Developer চাইলে false করে দিবে

export interface SyncResponse {
  success: boolean;
  message: string;
  syncedId?: number;
  caseNumber?: string;
  data?: any;
}

// // Helper: State Lookup ID
// const getStateLookupId = (state: string): number => {
//   const mapping: Record<string, number> = {
//     'CA': 1, 'NY': 2, 'TX': 3, 'FL': 4, 'IL': 5,
//     'PA': 6, 'OH': 7, 'GA': 8, 'NC': 9, 'MI': 10,
//   };
//   return mapping[state] || 1;
// };

// // Helper: Relationship Lookup ID
// const getRelationshipLookupId = (relationship: string): number => {
//   const mapping: Record<string, number> = {
//     'Mother': 1, 'Father': 2, 'Guardian': 3, 'Other': 4,
//   };
//   return mapping[relationship] || 3;
// };

// // Helper: County Lookup ID
// const getCountyLookupId = (county: string): number => {
//   const mapping: Record<string, number> = {
//     'County A': 1, 'County B': 2,
//   };
//   return mapping[county] || 0;
// };

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
    assessmentCompletedDate: (safeData.assessmentCompletedDate && safeData.assessmentCompletedDate !== 'Pending' && safeData.assessmentCompletedDate !== '') 
      ? safeData.assessmentCompletedDate 
      : (safeData.dateCompleted && safeData.dateCompleted !== 'Pending' && safeData.dateCompleted !== '') 
        ? safeData.dateCompleted 
        : null,
    homeName: safeData.homeName || safeData.name || '',
    relationshipLookupId: safeData.relationship ? parseInt(safeData.relationship) : (safeData.relationshipLookupId || 0),
    
    address: safeData.address || '',
    city: safeData.city || '',
    stateLookupId: safeData.state ? parseInt(safeData.state) : (safeData.stateLookupId || 0),
    zip: safeData.zip || '',
    communityLookupId: safeData.communityLookupId || 1,
    countyLookupId: safeData.countyLookupId || 0,
    county: safeData.county || '',
    
    areThereConcernsInTheHome: safeData.hasHomeConcerns === 'Yes',
    weaponInHome: (safeData.weapons || []).includes('Weapon(s) in Home'),
    weaponAccessible: (safeData.weapons || []).includes('Weapon(s) Accessible'),
    gunsAndAmmunitionNotStoredProperly: (safeData.weapons || []).includes('Guns & Ammunition NOT Stored Separately or Properly'),
    noConcernsForAccessToWeapons: (safeData.weapons || []).includes('No Concerns'),
    
    inadequateSleepingArrangements: (safeData.livingSpace || []).includes('Inadequate Sleeping Arrangements'),
    childDoesNotHaveOwnSpace: (safeData.livingSpace || []).includes('Child Does not have His/Her Own Space'),
    noConcernsForChildLivingSpace: (safeData.livingSpace || []).includes('No Concerns'),
    
    trashPiledUpInsideOrOutsideHome: (safeData.sanitation || []).includes('Trash or Bags of Trash piled up Inside or Outside The Home'),
    clutterInsideTheHome: (safeData.sanitation || []).includes('Clutter Inside The Home That Affects The Living Environment'),
    animalFecesWithinHome: (safeData.sanitation || []).includes('Animal Feces Within the home / Around Outside Home'),
    insectsWithinHome: (safeData.sanitation || []).includes('Insects and Rodents Within The Home'),
    foodIsNotStoredProperly: (safeData.sanitation || []).includes('Food Isn’t Stored Away Properly'),
    noConcernsForSanitation: (safeData.sanitation || []).includes('No Concerns'),
    
    poisonsNotStoredProperly: (safeData.chemicals || []).includes('Poisons Not Stored Away Properly'),
    sharpObjectsNotStoredProperly: (safeData.chemicals || []).includes('Sharp objects Not Stored Away Properly'),
    smallObjectsWithinReach: (safeData.chemicals || []).includes('Small Objects / Choking Hazards Within Reach'),
    noConcernsForAccessToChemicals: (safeData.chemicals || []).includes('No Concerns'),
    
    signsOfExcessiveAlcohol: (safeData.substanceUse || []).includes('Signs of Excessive Alcohol Use, and Use of Illicit Drugs, Accessible Drugs and Alcohol'),
    medicationsNotStoredProperly: (safeData.substanceUse || []).includes('Medications Not Stored Away Properly (out of reach/in locked cabinet)'),
    alcoholAndCigarettesNotOutOfReach: (safeData.substanceUse || []).includes('Alcohol and Cigarettes Not Out of Reach'),
    noConcernsForSignsOfSubstanceUseOrAbuse: (safeData.substanceUse || []).includes('No Concerns'),
    
    violenceInHomeOrNeighborhood: (safeData.climate || []).includes('High / Concerning Level of Violence in Home or Neighborhood'),
    trafficInAndOutOfTheHome: (safeData.climate || []).includes('High / Concerning Traffic In and Out of The Home'),
    levelOfSupport: (safeData.climate || []).includes('No or Low Level of Support'),
    inaccessibilityOfTransportation: (safeData.climate || []).includes('Inaccessibility of Transportation'),
    accessibilityOfCommunication: (safeData.climate || []).includes('Inaccessibility of Communication (telephone, other methods, etc.)'),
    noConcernsForClimateOfNeighborhoodOrHome: (safeData.climate || []).includes('No Concerns'),
    
    otherConcernsInHome: safeData.homeConcernsExplanation || null,
    
    physicalStatusOfHomeConcers: safeData.hasPhysicalConcerns === 'Yes',
    exposedElectricalWires: (safeData.physicalItems || []).includes('Exposed Electrical Wires / Faulty Wiring'),
    exposedOutlets: (safeData.physicalItems || []).includes('Exposed Outlets'),
    brokenWindows: (safeData.physicalItems || []).includes('Broken Windows'),
    noRunningWater: (safeData.physicalItems || []).includes('No Running Water / No Access to Water'),
    scaldingWater: (safeData.physicalItems || []).includes('Scalding Water'),
    standingWater: (safeData.physicalItems || []).includes('Standing Water (poses danger to drowning / insects / etc.)'),
    noPower: (safeData.physicalItems || []).includes('No Power'),
    inadequateHeatingOrCoolingSystem: (safeData.physicalItems || []).includes('Inadequate Heating/Cooling System'),
    noSmokeMonoxideDetectors: (safeData.physicalItems || []).includes('Home Doesn’t Have Smoke/Carbon Monoxide Detectors'),
    stairsAreNotSecured: (safeData.physicalItems || []).includes('Stairs Aren’t Secured'),
    lackOfbarriersOnStairsPorchesAndWindows: (safeData.physicalItems || []).includes('Lack of Barriers on The Stairs, porches, and Windows'),
    holesInFloorOrWalls: (safeData.physicalItems || []).includes('Holes in The Floor/Walls'),
    cordsOnBlindsAndCurtainsNotOutofReach: (safeData.physicalItems || []).includes('Cords on Blinds and Curtains not Out of Reach (Age Appropriate)'),
    moldOrMildewInTheHome: (safeData.physicalItems || []).includes('Mold / Mildew in The Home'),
    septicProblems: (safeData.physicalItems || []).includes('Septic Problems'),
    othePhysicalStatusOfHomeConcerns: (safeData.physicalItems || []).includes('Other'),
    explainAnyOfPhysicalStatusOfHomeMarked: safeData.homeConcernsExplanation || null,
    
    otheRiskIssuesInHome: safeData.otherRiskIssues === 'Yes',
    otheRiskIssuesInHomeExplaintion: safeData.otherRiskExplanation || null,
    abandonmentORAggravatedCircumstances: safeData.abandonmentText || null,
    
    isThereNeedForCustody: (safeData.capacities || []).includes('Need For Custody'),
    isChildSafeAtHome: (safeData.capacities || []).includes('Child Is Safe At Home') || safeData.isChildSafeAtHome || false,
    safetyPlanCreated: (safeData.capacities || []).includes('Safety Plan Created'),
    
    recognizesThreats: (safeData.capacities || []).includes('Recognizes Threats'),
    canArticulateplanToProtectTheChild: (safeData.capacities || []).includes('Can Articulate a Plan Sufficient to Protect The Child'),
    demonstratesProtectiveRoleAndResponsibilities: (safeData.capacities || []).includes('Demonstrates Protective Role and Responsibilities; Has a History of Taking Action to Protect'),
    recognizesTheChildsNeeds: (safeData.capacities || []).includes('Recognizes The Child\'s Needs and Holds Realistic Expectations'),
    expressesEmpathySensitivityForTheChild: (safeData.capacities || []).includes('Expresses Empathy and Sensitivity For The Child'),
    hasKnowledgeToProtectTheChild: (safeData.capacities || []).includes('Has The Cognitive Capacity and Has Adequate Knowledge to Protect The Child, Including Using Resources Necessary to Meet The Child\'s Basic Needs'),
    caretakerProcessesExternalWorld: (safeData.capacities || []).includes('The Caretaker Accurately processes The External World Without Distortions'),
    hasCapacityToLearn: (safeData.capacities || []).includes('Has The Capacity to Learn From an Experience and Apply It to a New Situation'),
    isEmotionallyAbleToInterveneAndProtect: (safeData.capacities || []).includes('Is Emotionally Able to Intervene And Protect'),
    isResilientAsCaregiver: (safeData.capacities || []).includes('Is Resilient As a Caregiver'),
    isAdaptiveAsCaregiver: (safeData.capacities || []).includes('Is Adaptive As a Caregiver'),
    setsAsideNeedsForChild: (safeData.capacities || []).includes('Sets Aside Her/His Needs in Favor of The Child'),
    demonstratesTolerance: (safeData.capacities || []).includes('Demonstrates Tolerance'),
    demonstratesEmotionalControl: (safeData.capacities || []).includes('Demonstrates Sufficient Impulse and Emotional Control'),
    isPhysicallyAbleToProtect: (safeData.capacities || []).includes('Is Physically Able to Protect'),
    caregiverAndChildHaveStrongEmotional: (safeData.capacities || []).includes('Caregiver and Child Have a Strong Emotional Bond and Positive Attachment'),
    
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
    console.log(`🔍 Checking API health at: ${API_BASE_URL.split('/api')[0]}`);
    const baseUrl = API_BASE_URL.split('/api')[0];
    await fetch(`${baseUrl}`, { method: 'GET', mode: 'no-cors' });
    console.log(`✅ API health check passed`);
    return true;
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
    const url = `${API_BASE_URL}/PushAddHomeAssessmentWeb?caseNumber=${encodedCaseNumber}`;
    
    console.log('🔄 Syncing assessment for case:', caseNumber);
    console.log('📡 API URL:', url);
    
    const payload = buildAssessmentPayload(safeData, caseNumber);
    
    console.log('📤 Final Assessment Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
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