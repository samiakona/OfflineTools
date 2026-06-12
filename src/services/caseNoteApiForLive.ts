// services/caseNoteApiForLive.ts
const API_BASE_URL = 'https://localhost:44361/api/OfflineSync';
//https://localhost:44361/api/OfflineSync/PushAddSafetyWorkerNoteWeb
export interface SyncResponse {
  success: boolean;
  message: string;
  syncedId?: number;
  caseNumber?: string;
}

// Direct mapping functions (frontend value to backend lookup ID)
const getEventStatusLookupId = (status: string): number => {
  const mapping: Record<string, number> = {
    'Scheduled': 1,
    'Completed': 2,
    'Cancelled': 3,
    'Rescheduled': 4,
    'No Show': 5,
  };
  return mapping[status] || 2; // Default: Completed
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

// API Health Check
export const checkAPIHealth = async (): Promise<boolean> => {
  try {
    // Use a simple GET request to the base URL to check if the server is reachable,
    // avoiding a 400 Bad Request from hitting a POST endpoint without a valid body.
    const baseUrl = API_BASE_URL.split('/api')[0];
    await fetch(`${baseUrl}`, { method: 'GET', mode: 'no-cors' });
    return true;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

// Main sync function
export const syncSingleNote = async (caseNumber: string, noteData: any): Promise<SyncResponse> => {
  try {
    const safeNoteData = noteData || {};
    const encodedCaseNumber = encodeURIComponent(caseNumber || 'DEFAULT-CASE');
    const url = `${API_BASE_URL}/PushAddSafetyWorkerNoteWeb?caseNumber=${encodedCaseNumber}`;

    console.log('🔄 Syncing note for case:', caseNumber);
    console.log('📦 Original note data:', safeNoteData);

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

    // Build payload exactly matching backend structure
    const payload = {
      id: 0,
      recordedBy: safeNoteData.teamMember || 'Kona_Supervisor',
      recordedOn: new Date().toISOString(),
      createdBy: safeNoteData.teamMember || 'Kona_Supervisor',
      createdOn: new Date().toISOString(),
      clientType: safeNoteData.clientType !== undefined && safeNoteData.clientType !== null ? parseInt(safeNoteData.clientType, 10) : 0,
      eventDate: eventDate,
      eventTime: eventTime,
      duration: safeNoteData.durationMinutes || 60,
      eventStatusLookupId: getEventStatusLookupId(safeNoteData.appointmentStatus || 'Completed'),
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
      people: safeNoteData.people || null
    };

    console.log('📤 Final Backend Payload:', JSON.stringify(payload, null, 2));

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

    // Map the backend response to our expected SyncResponse interface
    // The backend returns an object like { message: "...", caseId: 14, ... }
    // Since we reached here without a non-200 status, we consider it a success.
    return {
      success: true, // or we can check result.message.includes('Successfully') if we want to be stricter
      message: result.message || 'Note synced successfully',
      syncedId: result.caseId, // Or whichever ID is appropriate
      caseNumber: caseNumber
    };

  } catch (error: any) {
    console.error('❌ Sync error:', error);
    return {
      success: false,
      message: error.message || 'Network error',
    };
  }
};