
import { db } from '../db/dexie';
import type { VisitNotesData } from '../types/visitNotes';

export const visitNotesService = {
  /**
   * IndexedDB থেকে সব visit notes নিয়ে আসে
   */
  getAll: async (): Promise<VisitNotesData[]> => {
    return await db.visitNotes.toArray();
  },
  

  getById: async (id: number): Promise<VisitNotesData | undefined> => {
    return await db.visitNotes.get(id);
  },
  
  /**
   * নতুন visit note তৈরি করে এবং ক্রিয়েশন টাইমস্ট্যাম্প যুক্ত করে
   */
  create: async (item: VisitNotesData): Promise<number> => {
    const timestamp = new Date().toISOString();
    return await db.visitNotes.add({
      ...item,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  },
  
  /**
   * বিদ্যমান visit note আপডেট করে এবং মডিফিকেশন টাইমস্ট্যাম্প সেট করে
   */
  update: async (id: number, updatedItem: VisitNotesData): Promise<number> => {
    const timestamp = new Date().toISOString();
    // ইমিউটেবল ফিল্ড যেমন id এবং createdAt বাদ দিয়ে অবজেক্ট ক্লিন করা
    const { id: _, createdAt, ...cleanData } = updatedItem; 
    
    return await db.visitNotes.update(id, {
      ...cleanData,
      updatedAt: timestamp
    });
  },
  
  /**
   * নির্দিষ্ট আইডি-র visit note ডাটাবেজ থেকে মুছে ফেলে
   */
  delete: async (id: number): Promise<void> => {
    await db.visitNotes.delete(id);
  },

  /**
   * visitNotes টেবিলের সমস্ত ডাটা ফ্লাশ বা ক্লিয়ার করে
   */
  clearAll: async (): Promise<void> => {
    await db.visitNotes.clear();
  }
};