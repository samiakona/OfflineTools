import { db } from '../db/dexie';
import type { CaseNote } from '../types/caseNote';


export const caseNoteService = {



    exportBackupData: async () => {
    const allNotes = await db.caseNotes.toArray();
    return {
      databaseName: db.name,
      version: db.verno,
      exportedAt: new Date().toISOString(),
      data: allNotes,
    };
  },  
importBackupData: async (parsedBackup: any): Promise<void> => {
    if (!parsedBackup || !Array.isArray(parsedBackup.data)) {
      throw new Error("Invalid backup file structure.");
    }

    // আগের সব লোকাল ডেটা মুছে ফেলা
    await db.caseNotes.clear();
    
    // নতুন ডেটা একসঙ্গে পুশ করা (Bulk Add)
    if (parsedBackup.data.length > 0) {
      await db.caseNotes.bulkAdd(parsedBackup.data);
    }
},
  
  /**
   * 📥 GET ALL NOTES (Fetch local records)
   */
  getAllNotes: async (): Promise<CaseNote[]> => {
    return await db.caseNotes.orderBy('createdAt').reverse().toArray();
  },

  /**
   * 🔍 GET SINGLE NOTE BY ID (For Edit Mode Fetching)
   */
  getNoteById: async (id: number): Promise<CaseNote | undefined> => {
    return await db.caseNotes.get(id);
  },

  /**
   * ➕ ADD NEW NOTE (Create API Equivalent)
   */
  createNote: async (noteData: Omit<CaseNote, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>, operator: string): Promise<number> => {
    const now = Date.now();
    const newNote: CaseNote = {
      ...noteData,
      createdAt: now,
      createdBy: operator,
      updatedAt: now,
      updatedBy: operator
    };
    return await db.caseNotes.add(newNote);
  },

  /**
   * ✏️ EDIT / UPDATE NOTE (Update API Equivalent)
   */
  updateNote: async (id: number, noteData: Partial<CaseNote>, operator: string): Promise<number> => {
    const now = Date.now();
    return await db.caseNotes.update(id, {
      ...noteData,
      updatedAt: now,
      updatedBy: operator
    });
  },

  /**
   * ❌ DELETE SINGLE NOTE (Delete API Equivalent)
   */
  deleteNote: async (id: number): Promise<void> => {
    return await db.caseNotes.delete(id);
  },

  /**
   * 🧹 CLEAR ENTIRE DATABASE
   */
  clearAllNotes: async (): Promise<void> => {
    return await db.caseNotes.clear();
  }


  
};