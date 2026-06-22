import { useState } from 'react';

import { 
  syncSingleNote, 
  checkAPIHealth, 
  syncMultipleNotes,
  getCaseNoteApiConfig,
  testApiConnection
} from '../services/caseNoteApiForLive';
import type { CaseNote } from '../types/caseNote';

interface SyncResult {
  success: boolean;
  message: string;
  syncedId?: number;
  caseNumber?: string;
}

interface SyncProgress {
  current: number;
  total: number;
}

export const useCaseNoteSync = () => {
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({ current: 0, total: 0 });
  const [isSyncing, setIsSyncing] = useState(false);
  const [apiConfig, setApiConfig] = useState(() => getCaseNoteApiConfig());

  // Check API connectivity using your API service
  const checkAPI = async (): Promise<boolean> => {
    return await checkAPIHealth();
  };

  // Test API connection
  const testConnection = async (): Promise<{ success: boolean; message: string }> => {
    return await testApiConnection();
  };

  // Get API configuration
  const getConfig = () => {
    return getCaseNoteApiConfig();
  };

  // Sync single note
  const syncNote = async (caseNumber: string, localNote: any): Promise<SyncResult> => {
    try {
      console.log('📤 Syncing note to server:', { caseNumber, localNote });

      // ✅ Use your API service to sync
      const result = await syncSingleNote(caseNumber, localNote);
      
      console.log('📤 Sync result:', result);
      return result;
    } catch (error) {
      console.error('❌ Sync error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  };

  // Sync all local notes
  const syncAllLocalNotes = async (allNotes: CaseNote[]): Promise<SyncResult> => {
    setSyncProgress({ current: 0, total: allNotes.length });
    setIsSyncing(true);

    let successCount = 0;
    let errors: string[] = [];

    try {
      // Use bulk sync for better performance
      if (allNotes.length > 1) {
        const bulkResult = await syncMultipleNotes(allNotes);
        return {
          success: bulkResult.success,
          message: `Synced ${bulkResult.totalSynced}/${allNotes.length} notes successfully`,
        };
      }

      // Single note sync
      for (let i = 0; i < allNotes.length; i++) {
        const note = allNotes[i];
        setSyncProgress({ current: i + 1, total: allNotes.length });

        try {
          const caseNumber = note.caseName || 'DEFAULT-CASE';
          const result = await syncNote(caseNumber, note);
          
          if (result.success) {
            successCount++;
          } else {
            errors.push(`Note ${note.id}: ${result.message}`);
          }
        } catch (error) {
          errors.push(`Note ${note.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const message = `Synced ${successCount}/${allNotes.length} notes successfully`;
      
      if (errors.length > 0) {
        console.warn('⚠️ Some notes failed to sync:', errors);
        return {
          success: successCount > 0,
          message: `${message}. ${errors.length} failed.`
        };
      }

      return {
        success: true,
        message: message
      };
    } catch (error) {
      console.error('❌ Sync all error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync all notes'
      };
    } finally {
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0 });
    }
  };

  return {
    syncProgress,
    isSyncing,
    syncNote,
    syncAllLocalNotes,
    checkAPI,
    testConnection,
    getConfig, // ✅ Added getConfig to return object
    apiConfig
  };
};