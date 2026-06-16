
import { db } from '../hooks/dexie';
import type { HomeStudyAssessmentData } from '../types/homeStudy';

export const homeStudyService = {
  // ১. নতুন অ্যাসেসমেন্ট তৈরি করা
  async create(data: Omit<HomeStudyAssessmentData, 'id'>) {
    const timestamp = new Date().toISOString();
    return await db.table('homeStudyAssessments').add({
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },

  // ২. আইডি অনুযায়ী নির্দিষ্ট ডেটা খোঁজা (Edit/View এর জন্য)
  async getById(id: number): Promise<HomeStudyAssessmentData | undefined> {
    return await db.table('homeStudyAssessments').get(id);
  },

  // ৩. বিদ্যমান ডেটা আপডেট করা
  async update(id: number, data: Partial<HomeStudyAssessmentData>) {
    return await db.table('homeStudyAssessments').update(id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  // ৪. সব অ্যাসেসমেন্টের লিস্ট নেওয়া
  async getAll(): Promise<HomeStudyAssessmentData[]> {
    return await db.table('homeStudyAssessments').reverse().toArray(); // লেটেস্ট আগে আসবে
  },

  // ৫. ডিলিট করার প্রয়োজন হলে
  async delete(id: number) {
    return await db.table('homeStudyAssessments').delete(id);
  }
};