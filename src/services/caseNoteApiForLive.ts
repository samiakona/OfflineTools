// API Base URL
const API_BASE_URL = 'http://localhost:5096/api/casenote';

export interface SyncResponse {
  success: boolean;
  message: string;
  syncedId?: number;
  caseNumber?: string;
}

// API চেক করার ফাংশন
export const checkAPIHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const result = await response.json();
    console.log('API Health Check:', result);
    return result.success === true;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

// একক নোট সিঙ্ক করার ফাংশন - নিরাপদভাবে প্রপার্টি অ্যাক্সেস
// একক নোট সিঙ্ক করার ফাংশন
export const syncSingleNote = async (caseNumber: string, noteData: any): Promise<SyncResponse> => {
  try {
    const safeNoteData = noteData || {};
    
    const encodedCaseNumber = encodeURIComponent(caseNumber || 'DEFAULT-CASE');
    const url = `${API_BASE_URL}/sync?caseNumber=${encodedCaseNumber}`;
    
    console.log('Sending to URL:', url);
    console.log('Case Number:', caseNumber);
    console.log('Note Data:', safeNoteData);

    // 🔴 সবসময় id = 0 পাঠান (সবসময় নতুন নোট তৈরি করতে)
    // লোকাল ID সার্ভারে পাঠানোর দরকার নেই
    const id = 0;  // 🔴 এটা পরিবর্তন করুন - সবসময় 0 পাঠান
    
    const teamMember = safeNoteData.teamMember || safeNoteData.recordedBy || 'System';
    const recordedBy = teamMember;
    const createdBy = safeNoteData.createdBy || 'System';
    const clientType = parseInt(safeNoteData.clientType) || 0;
    const duration = safeNoteData.durationMinutes || 30;
    const notes = safeNoteData.narrative || '';
    const notifyAll = safeNoteData.notifyTeam || false;
    const isCompleted = safeNoteData.isCompleted || false;
    
    let eventDate = new Date().toISOString();
    let eventTime = new Date().toISOString();
    
    if (safeNoteData.date) {
      eventDate = new Date(safeNoteData.date).toISOString();
    }
    
    if (safeNoteData.date && safeNoteData.time) {
      eventTime = new Date(`${safeNoteData.date} ${safeNoteData.time}`).toISOString();
    }

    const payload = {
      id: id,  // 🔴 সবসময় 0
      recordedBy: recordedBy,
      recordedOn: new Date().toISOString(),
      createdBy: createdBy,
      createdOn: new Date().toISOString(),
      clientType: clientType,
      eventDate: eventDate,
      eventTime: eventTime,
      duration: duration,
      notes: notes,
      notifyAll: notifyAll,
      isCompleted: isCompleted,
    };

    console.log('Final Payload:', payload);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('Response data:', result);
    return result;
  } catch (error: any) {
    console.error('Sync error:', error);
    return {
      success: false,
      message: error.message || 'Network error',
    };
  }
};