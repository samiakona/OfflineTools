import { useState, useCallback, useEffect } from 'react';
import { syncSingleNote, checkAPIHealth, type SyncResponse } from '../services/caseNoteApiForLive';

export const useCaseNoteSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  // একক নোট সিঙ্ক
  const syncNote = useCallback(async (caseNumber: string, noteData: any): Promise<SyncResponse> => {
    if (!isOnline) {
      return { success: false, message: 'No internet connection' };
    }

    setIsSyncing(true);
    try {
      // 🔴 নোট ডাটা কপি করে পাঠান
      const safeNoteData = { ...noteData };
      const result = await syncSingleNote(caseNumber, safeNoteData);
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

      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        if (!note) continue;
        
        const caseNumber = note.caseName || note.caseNumber || 'DEFAULT-CASE';
        
        console.log(`Syncing note ${i + 1}/${notes.length} - ID: ${note.id}, Case: ${caseNumber}`);
        
        const result = await syncSingleNote(caseNumber, note);
        if (result.success) {
          synced++;
        } else {
          failed++;
          console.error(`Failed to sync note ${note.id}: ${result.message}`);
        }
        setSyncProgress({ current: i + 1, total: notes.length });
      }

      return { success: failed === 0, synced, failed, message: `Synced: ${synced}, Failed: ${failed}` };
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
    syncNote,
    syncAllLocalNotes,
    checkAPI,
  };
};