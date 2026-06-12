// hooks/useCaseNoteSync.ts
import { useState, useCallback, useEffect } from 'react';
import { syncSingleNote, checkAPIHealth, type SyncResponse } from '../services/caseNoteApiForLive';

export const useCaseNoteSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResponse | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // একক নোট সিঙ্ক - সঠিক payload তৈরি করবে
  const syncNote = useCallback(async (caseNumber: string, noteData: any): Promise<SyncResponse> => {
    if (!isOnline) {
      return { success: false, message: 'No internet connection' };
    }

    setIsSyncing(true);
    try {
      // Ensure noteData has all required fields
      const enhancedNoteData = {
        ...noteData,
        // Make sure these fields exist with proper values
        appointmentStatus: noteData.appointmentStatus || 'Completed',
        contactType: noteData.contactType || '2',  // Face to Face default
        location: noteData.location || '4',         // School default
        serviceType: noteData.serviceType || '7',   // Child Contact default
        additionalServices: noteData.additionalServices || [],
        narrative: noteData.narrative || noteData.notes || '',
        notifyTeam: noteData.notifyTeam || false,
        teamMember: noteData.teamMember || 'System',
        durationMinutes: noteData.durationMinutes || 30,
      };
      
      const result = await syncSingleNote(caseNumber, enhancedNoteData);
      setLastSyncResult(result);
      return result;
    } catch (error: any) {
      console.error('Sync note error:', error);
      return {
        success: false,
        message: error.message || 'Sync failed',
      };
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);

  // সব নোট সিঙ্ক
  const syncAllLocalNotes = useCallback(async (notes: any[]) => {
    if (!isOnline) {
      return { success: false, message: 'No internet connection', synced: 0, failed: notes.length };
    }

    if (!notes || notes.length === 0) {
      return { success: true, message: 'No notes to sync', synced: 0, failed: 0 };
    }

    setIsSyncing(true);
    setSyncProgress({ current: 0, total: notes.length });

    try {
      let synced = 0;
      let failed = 0;
      const failedNotes: any[] = [];

      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        if (!note) continue;
        
        const caseNumber = note.caseName || note.caseNumber || 'DEFAULT-CASE';
        
        console.log(`Syncing note ${i + 1}/${notes.length} - Case: ${caseNumber}`);
        
        const result = await syncSingleNote(caseNumber, note);
        if (result.success) {
          synced++;
          console.log(`✅ Note synced successfully! Server ID: ${result.syncedId}`);
        } else {
          failed++;
          failedNotes.push({ note, error: result.message });
          console.error(`❌ Failed to sync note: ${result.message}`);
        }
        setSyncProgress({ current: i + 1, total: notes.length });
      }

      if (failed > 0) {
        console.warn(`Sync completed with ${failed} failures:`, failedNotes);
      }

      return { 
        success: failed === 0, 
        synced, 
        failed, 
        message: `Synced: ${synced}, Failed: ${failed}`,
        failedNotes 
      };
    } finally {
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0 });
    }
  }, [isOnline]);

  const checkAPI = useCallback(async (): Promise<boolean> => {
    return await checkAPIHealth();
  }, []);

  return {
    isSyncing,
    syncProgress,
    isOnline,
    lastSyncResult,
    syncNote,
    syncAllLocalNotes,
    checkAPI,
  };
};