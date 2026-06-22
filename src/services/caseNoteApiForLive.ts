// services/caseNoteApiForLive.ts

// 🔧 API Configuration - Developer শুধু এই URL পরিবর্তন করবে
// Mock URL for testing
const API_BASE_URL = 'https://localhost:44361/api/OfflineSync';
// Real URL: https://your-actual-server.com/api/OfflineSync

// 🎭 Mock Mode - true হলে রিয়েল API কল না করে Mock ডেটা দেখাবে
const USE_MOCK_MODE = false; // true = Mock Mode, false = Real API

export interface SyncResponse {
  success: boolean;
  message: string;
  syncedId?: number;
  caseNumber?: string;
  data?: any;
}

// ✅ Client Type Mapping
const getClientType = (clientType: string | undefined): number => {
  const mapping: Record<string, number> = {
    '0': 0,  // Child
    '1': 1,  // Parent
    '2': 2,  // Other
    '3': 3,  // Group
  };
  const val = mapping[clientType || '2'];
  return val !== undefined ? val : 2;
};

// ✅ People Data Builder
const buildPeopleData = (noteData: any): string | null => {
  try {
    // If people data already exists as string, return it
    if (noteData.people && typeof noteData.people === 'string') {
      return noteData.people;
    }

    const peopleData = {
      Children: noteData.childNames?.map((name: string, index: number) => ({
        id: index + 1,
        name: name
      })) || [],
      Parents: noteData.parentNames?.map((name: string, index: number) => ({
        id: index + 10,
        name: name
      })) || [],
      OtherChildren: [],
      OtherParents: [],
      FamilySource: [],
      CollateralSources: [],
      Clients: []
    };

    // If both Children and Parents arrays are empty, return primitive null
    if (peopleData.Children.length === 0 && peopleData.Parents.length === 0) {
      return null;
    }

    return JSON.stringify(peopleData);
  } catch (error) {
    console.warn('Failed to build people data:', error);
    return null;
  }
};

// Direct mapping functions (frontend value to backend lookup ID)
const getEventStatusLookupId = (status: string): number => {
  const mapping: Record<string, number> = {
    '1': 1,  // Attended
    '2': 2,  // Cancel By client
    '3': 3,  // Cancel By provider
    '4': 4,  // Cancel By FSP
    '5': 5,  // No Show
    '6': 6,  // Unable to See/Other
    '7': 7,  // N/A
  };
  return mapping[status] || 1; // Default: Attended
};

const getCaseNoteContactTypeLookupId = (contactType: string): number => {
  const mapping: Record<string, number> = {
    '1': 1,  // Phone
    '2': 2,  // Face to Face
    '3': 3,  // Email
    '4': 4,  // Text
    '5': 5,  // N/A
    '6': 6,  // Letter
    '7': 7,  // Virtual
    '8': 8,  // Note to File
    '9': 9,  // Staffing
  };
  return mapping[contactType] || 2; // Default: Face to Face
};

const getLocationLookupId = (location: string): number => {
  const mapping: Record<string, number> = {
    '1': 1,   // Home
    '2': 2,   // Office
    '3': 3,   // Relatives Home
    '4': 4,   // School
    '5': 5,   // Community Home
    '6': 6,   // Foster Care
    '7': 7,   // Therapeutic Foster Care
    '8': 8,   // Work
    '9': 9,   // Not Applicable
    '10': 10, // Jail/Prison
    '11': 11, // Hospital
    '12': 12, // Court
    '13': 13, // Placement Location
    '14': 14, // WIC
    '15': 15, // Child Support
    '16': 16, // Enrollment
    '17': 17, // Food Stamps
    '18': 18, // Community Visit
    '19': 19, // Other
  };
  return mapping[location] || 4; // Default: School
};

const getCaseEventLookupId = (serviceType: string): number => {
  const mapping: Record<string, number> = {
    '1': 1,   // Child and Family Team
    '2': 2,   // Residential Placement
    '3': 3,   // Treatment Contract
    '4': 4,   // N/A
    '5': 5,   // Placement Contact
    '6': 6,   // Parent Contact
    '7': 7,   // Child Contact
    '8': 8,   // Support Meeting
    '9': 9,   // Court
    '10': 10, // Transportation
    '11': 11, // Supervised Visit
    '12': 12, // Medical
    '13': 13, // BH Contact (For Therapy)
    '14': 14, // School Contact
    '15': 15, // PIP
    '16': 16, // Obtaining Community Resources
    '17': 17, // General Case Management
    '18': 18, // Staffing with Supervisor
    '19': 19, // Staffing with Group
    '20': 20, // Legal
    '21': 21, // Closing Summary
    '22': 22, // PAP
    '23': 23, // Wizards and Fairies
    '24': 24, // Update Case Plan
  };
  return mapping[serviceType] || 7; // Default: Child Contact
};

// Helper function to format time to ISO string
const formatTimeToISO = (dateStr: string, timeStr: string): string => {
  if (!dateStr || !timeStr) return new Date().toISOString();

  const parsedDate = new Date(dateStr);
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);

  if (match) {
    let hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const period = match[3].toUpperCase();

    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    parsedDate.setHours(hour, minute, 0, 0);
  }

  return parsedDate.toISOString();
};

// 🎭 Mock Sync Function
const mockSyncNote = async (caseNumber: string, payload: any): Promise<SyncResponse> => {
  console.log('🎭 ===== MOCK CASE NOTE SYNC STARTED =====');
  console.log('📌 Case Number:', caseNumber);
  console.log('📦 Payload:', JSON.stringify(payload, null, 2));
  console.log('🎭 ===== MOCK PAYLOAD END =====');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock success response
  const mockResponse = {
    success: true,
    message: '✅ Case Note synced successfully (MOCK MODE)',
    syncedId: Math.floor(Math.random() * 10000),
    caseNumber: caseNumber,
    data: {
      ...payload,
      syncedAt: new Date().toISOString(),
      mockMode: true,
      serverResponse: {
        status: 'Success',
        caseId: Math.floor(Math.random() * 1000),
        message: 'Note saved successfully'
      }
    }
  };

  console.log('🎭 Mock Response:', mockResponse);
  return mockResponse;
};

// 🌐 Real API Sync Function
const realSyncNote = async (caseNumber: string, payload: any): Promise<SyncResponse> => {
  try {
    const encodedCaseNumber = encodeURIComponent(caseNumber || 'DEFAULT-CASE');
    const url = `${API_BASE_URL}/PushAddSafetyWorkerNoteWeb?caseNumber=${encodedCaseNumber}`;

    console.log('🔄 Syncing note for case:', caseNumber);
    console.log('📡 API URL:', url);
    console.log('📤 Final Backend Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
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
      message: result.message || 'Note synced successfully',
      syncedId: result.caseId || result.id,
      caseNumber: caseNumber,
      data: result
    };

  } catch (error: any) {
    console.error('❌ Sync error:', error);
    return {
      success: false,
      message: error.message || 'Network error',
    };
  }
};

// 🏗️ Payload Builder Function
const buildPayload = (safeNoteData: any): any => {
  // Prepare dates and times
  const eventDate = safeNoteData.date ? new Date(safeNoteData.date).toISOString() : new Date().toISOString();
  const eventTime = safeNoteData.date && safeNoteData.time 
    ? formatTimeToISO(safeNoteData.date, safeNoteData.time)
    : new Date().toISOString();

  // Next appointment (if any)
  let nextAppointmentDate = null;
  let nextAppointmentTime = null;

  if (safeNoteData.nextAppointmentDate) {
    nextAppointmentDate = new Date(safeNoteData.nextAppointmentDate).toISOString();

    if (safeNoteData.nextAppointmentTime) {
      nextAppointmentTime = formatTimeToISO(
        safeNoteData.nextAppointmentDate, 
        safeNoteData.nextAppointmentTime
      );
    }
  }

  // Build people data
  const peopleData = buildPeopleData(safeNoteData);

  // Build payload exactly matching backend structure
  const loginIdStr = localStorage.getItem('loginId') || '3';
  const loginId = parseInt(loginIdStr, 10) || 3;

  return {
    id: 0,
    caseId: parseInt(safeNoteData.caseId) || 0,
    recordedBy: safeNoteData.teamMember || 'Kona_Supervisor',
    recordedOn: eventDate,
    createdBy: safeNoteData.teamMember || 'Kona_Supervisor',
    createdOn: eventDate,
    appUserId: loginId,
    clientType: getClientType(safeNoteData.clientType),
    childId: safeNoteData.clientType === '0' ? parseInt(safeNoteData.clientId) || null : null,
    parentId: safeNoteData.clientType === '1' ? parseInt(safeNoteData.clientId) || null : null,
    eventDate: eventDate,
    eventTime: eventTime,
    duration: safeNoteData.durationMinutes || 60,
    eventStatusLookupId: getEventStatusLookupId(safeNoteData.appointmentStatus || '1'),
    nextAppointmentDate: nextAppointmentDate,
    nextAppointmentTime: nextAppointmentTime,
    caseNoteContactTypeLookupId: getCaseNoteContactTypeLookupId(safeNoteData.contactType || '2'),
    locationLookupId: getLocationLookupId(safeNoteData.location || '4'),
    caseEventLookupId: getCaseEventLookupId(safeNoteData.serviceType || '7'),
    selectedAdditionalServiceList: safeNoteData.additionalServices || [],
    notes: safeNoteData.narrative || safeNoteData.notes || '',
    recipients: safeNoteData.otherAttendees || safeNoteData.teamMember || 'Kona_Supervisor',
    notifyAll: safeNoteData.notifyTeam === true,
    isCompleted: safeNoteData.isCompleted || false,
    people: peopleData
  };
};

// API Health Check
export const checkAPIHealth = async (): Promise<boolean> => {
  if (USE_MOCK_MODE) {
    console.log('🎭 MOCK: API Health Check - Always Online');
    return true;
  }

  try {
    // Use a simple GET request to the base URL to check if the server is reachable
    const baseUrl = API_BASE_URL.split('/api')[0];
    console.log(`🔍 Checking API health at: ${baseUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${baseUrl}`, { 
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-cache',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log(`✅ API health check response: ${response.status}`);
    return true;
  } catch (error) {
    console.error('❌ API health check failed:', error);
    return false;
  }
};

// Main sync function
export const syncSingleNote = async (caseNumber: string, noteData: any): Promise<SyncResponse> => {
  // 🎭 Mock Mode Check
  if (USE_MOCK_MODE) {
    const safeNoteData = noteData || {};
    const payload = buildPayload(safeNoteData);
    return await mockSyncNote(caseNumber, payload);
  }

  // 🌐 Real API Call
  try {
    const safeNoteData = noteData || {};
    const payload = buildPayload(safeNoteData);
    return await realSyncNote(caseNumber, payload);
  } catch (error: any) {
    console.error('❌ Sync error:', error);
    return {
      success: false,
      message: error.message || 'Network error',
    };
  }
};

// 📤 Bulk Sync Function
export const syncMultipleNotes = async (notes: any[]): Promise<{
  success: boolean;
  results: Array<{ index: number; success: boolean; error?: string; syncedId?: number }>;
  totalSynced: number;
}> => {
  try {
    const results = [];
    let successCount = 0;

    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const caseNumber = note.caseName || 'DEFAULT-CASE';
      
      const result = await syncSingleNote(caseNumber, note);
      
      results.push({
        index: i,
        success: result.success,
        error: result.success ? undefined : result.message,
        syncedId: result.syncedId
      });
      
      if (result.success) successCount++;
    }

    console.log(`📊 Bulk Sync Complete: ${successCount}/${notes.length} synced`);
    
    return {
      success: successCount === notes.length,
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
export const getCaseNoteApiConfig = () => ({
  apiBaseUrl: API_BASE_URL,
  mockMode: USE_MOCK_MODE,
  endpoint: `${API_BASE_URL}/PushAddSafetyWorkerNoteWeb`,
  isMockMode: USE_MOCK_MODE ? '🔮 Mock Mode Active' : '🌐 Live Mode Active'
});

// 🔍 Test function to verify API connection
export const testApiConnection = async (): Promise<{ success: boolean; message: string }> => {
  if (USE_MOCK_MODE) {
    return {
      success: true,
      message: '✅ Mock mode is active. API connection simulated.'
    };
  }

  try {
    const healthCheck = await checkAPIHealth();
    if (healthCheck) {
      return {
        success: true,
        message: '✅ API server is reachable'
      };
    } else {
      return {
        success: false,
        message: '❌ API server is not reachable. Please check your connection.'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `❌ Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// 📋 Sample payload for testing
export const getSamplePayload = () => {
  return {
    id: 0,
    recordedBy: 'Kona_Supervisor',
    recordedOn: new Date().toISOString(),
    createdBy: 'Kona_Supervisor',
    createdOn: new Date().toISOString(),
    clientType: 0,
    eventDate: new Date().toISOString(),
    eventTime: new Date().toISOString(),
    duration: 60,
    eventStatusLookupId: 1,
    nextAppointmentDate: null,
    nextAppointmentTime: null,
    caseNoteContactTypeLookupId: 2,
    locationLookupId: 4,
    caseEventLookupId: 7,
    selectedAdditionalServiceList: ['1', '21'],
    notes: '<p>Client attended the session.</p>',
    recipients: 'Kona_Supervisor',
    notifyAll: true,
    isCompleted: false,
    people: JSON.stringify({
      Children: [{ id: 1, name: 'Luna Aurora' }],
      Parents: [{ id: 10, name: 'Max Well' }],
      OtherChildren: [],
      OtherParents: [],
      FamilySource: [],
      CollateralSources: [],
      Clients: []
    })
  };
};

// 📋 Sample note data for testing
export const getSampleNoteData = () => {
  return {
    id: 1,
    date: '2026-06-19',
    time: '10:30 AM',
    childName: 'Luna Aurora',
    appointmentStatus: '1',
    nextAppointmentDate: '2026-06-26',
    nextAppointmentTime: '10:30 AM',
    contactType: '2',
    location: '4',
    serviceType: '7',
    additionalServices: ['1', '21'],
    durationMinutes: 60,
    caseName: 'CASE-2026-001',
    narrative: 'Client attended the session. Progress was made.',
    teamMember: 'Kona_Supervisor',
    otherAttendees: 'Social Worker',
    notifyTeam: true,
    isCompleted: false,
    clientType: '0',
    clientId: '1',
    clientName: 'Luna Aurora',
    childNames: ['Luna Aurora'],
    parentNames: ['Max Well']
  };
};

// ✅ Export all functions
export {
  checkAPIHealth as checkCaseNoteAPIHealth,
  syncSingleNote as syncCaseNote,
  syncMultipleNotes as syncMultipleCaseNotes,

};  