// services/homeStudyApiForLive.ts

// 🔧 API Configuration - Developer শুধু এই URL পরিবর্তন করবে
const API_BASE_URL = 'http://localhost:5096/api';

// 🎭 Mock Mode - true হলে রিয়েল API কল না করে Mock ডেটা দেখাবে
const USE_MOCK_MODE = true; // Developer চাইলে false করে দিবে

export interface HomeStudySyncResponse {
  success: boolean;
  message: string;
  syncedId?: number;
  caseNumber?: string;
  data?: any;
}

// 📤 Payload Builder Function
const buildHomeStudyPayload = (safeData: any, caseNumber: string) => {
  return {
    id: safeData.id || 0,
    assessmentDate: safeData.assessmentDate || new Date().toISOString().split('T')[0],
    assessmentTime: safeData.assessmentTime || null,
    contacts: safeData.contacts || '',
    sourceOfReferral: safeData.sourceOfReferral || '',
    directionsToHome: safeData.directionsToHome || '',
    motivationForTakingChild: safeData.motivationForTakingChild || '',
    
    familyHistoryBirthplace: safeData.bornAndRaised || '',
    familyHistoryParentsDetails: safeData.parentsDetails || '',
    familyHistorySiblingsDetails: safeData.siblingsDetails || '',
    familyHistoryRelationWithSiblings: safeData.siblingsRelationship || '',
    familyHistoryUpbringingDescription: safeData.howRaised || '',
    familyHistoryConflictResolution: safeData.conflictResolution || '',
    familyHistoryFamilyActivities: safeData.familyActivities || '',
    
    selfDescriptionPersonalDescription: safeData.selfDescription || '',
    selfDescriptionStrengthsWeaknesses: safeData.strengthsWeaknesses || '',
    selfDescriptionStressManagement: safeData.dealWithStress || '',
    selfDescriptionTriggers: safeData.thingsUpsetYou || '',
    
    educationHighSchoolAttended: safeData.highSchool || '',
    educationViewsOnEducation: safeData.importanceOfEducation || '',
    educationWillingnessToAttendTraining: safeData.newParentingSkills || '',
    
    workExperienceCurrentOccupationSchedule: safeData.currentOccupation || '',
    workExperienceCareerPlans: safeData.careerPlans || '',
    workExperienceRelevantExperience: safeData.workExperiencePrep || '',
    
    childrenDetails: safeData.describeChildren || '',
    integrationOfFosterChild: safeData.treatFosterChild || '',
    
    parentingStrengths: safeData.parentWellThings || '',
    parentingImprovements: safeData.parentImproveThings || '',
    parentingChallenges: safeData.parentUpsetThings || '',
    parentingExperiences: safeData.experiencesInsideHome || '',
    parentingFamilyRules: safeData.familyRules || '',
    
    disciplineMethods: safeData.disciplineOwnChildren || '',
    viewsOnPhysicalDiscipline: safeData.physicalDisciplineThoughts || '',
    
    chemicalUseAlcoholDrugUse: safeData.chemicalUseDescription || '',
    chemicalUseAcceptance: safeData.acceptableAlcoholUse || '',
    chemicalUseFamilyHistory: safeData.familyChemicalProblem || '',
    
    ethicalAndSpiritualBeliefsRoleOfSpiritualityCulture: safeData.spiritualityCultureRole || '',
    ethicalAndSpiritualBeliefsHandlingDifferingBeliefs: safeData.childBeliefsDiffer || '',
    ethicalAndSpiritualBeliefsPersonalValues: safeData.childPersonalBeliefsDiffer || '',
    
    financesFinancialManagement: safeData.moneyHandled || '',
    financesCurrentFutureFinancialPicture: safeData.financialPicture || '',
    
    isCompleted: safeData.isCompleted || false,
    
    recordedBy: safeData.recordedBy || 'Kona_Supervisor',
    recordedOn: safeData.recordedOn || new Date().toISOString(),
    createdBy: safeData.createdBy || 'Kona_Supervisor',
    createdOn: safeData.createdOn || new Date().toISOString(),
    
    caseNumber: caseNumber
  };
};

// 🎭 Mock Sync Function
const mockSyncHomeStudy = async (caseNumber: string, assessmentData: any): Promise<HomeStudySyncResponse> => {
  console.log('🎭 ===== MOCK HOME STUDY SYNC STARTED =====');
  console.log('📌 Case Number:', caseNumber);
  console.log('📦 Assessment Data:', assessmentData);
  
  const payload = buildHomeStudyPayload(assessmentData, caseNumber);
  
  console.log('📤 ===== COMPLETE HOME STUDY PAYLOAD =====');
  console.log(JSON.stringify(payload, null, 2));
  console.log('📤 ===== PAYLOAD END =====');
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    success: true,
    message: '✅ Home Study Assessment synced successfully (MOCK MODE)',
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
export const checkHomeStudyAPIHealth = async (): Promise<boolean> => {
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
export const syncHomeStudy = async (caseNumber: string, assessmentData: any): Promise<HomeStudySyncResponse> => {
  if (USE_MOCK_MODE) {
    return await mockSyncHomeStudy(caseNumber, assessmentData);
  }
  
  try {
    const safeData = assessmentData || {};
    const encodedCaseNumber = encodeURIComponent(caseNumber || 'DEFAULT-CASE');
    const url = `${API_BASE_URL}/sync?caseNumber=${encodedCaseNumber}`;
    
    console.log('🔄 Syncing home study assessment for case:', caseNumber);
    console.log('📡 API URL:', url);
    
    const payload = buildHomeStudyPayload(safeData, caseNumber);
    
    console.log('📤 Final Home Study Payload:', JSON.stringify(payload, null, 2));

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
      message: result.message || 'Home Study Assessment synced successfully',
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
export const syncMultipleHomeStudies = async (assessments: any[]): Promise<{
  success: boolean;
  results: Array<{ caseNumber: string; success: boolean; error?: string }>;
  totalSynced: number;
}> => {
  try {
    const results = [];
    let successCount = 0;

    for (const assessment of assessments) {
      const caseNumber = assessment.caseNumber || `HOME-STUDY-${assessment.id}`;
      const result = await syncHomeStudy(caseNumber, assessment);
      
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
export const getHomeStudyConfig = () => ({
  apiBaseUrl: API_BASE_URL,
  mockMode: USE_MOCK_MODE,
});