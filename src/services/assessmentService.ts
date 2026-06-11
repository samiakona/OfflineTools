
import { db, type AssessmentRecord } from '../db/dexie';
import type { AssessmentFormData } from '../types/assessment';
export const assessmentService = {
  /**
   * 📥 GET ALL ASSESSMENTS
   */
  getAllAssessments: async (): Promise<AssessmentRecord[]> => {
    return await db.assessments.toArray();
  },

  /**
   * 🔍 GET SINGLE ASSESSMENT BY ID (For Edit Mode)
   */
  getAssessmentById: async (id: number): Promise<AssessmentRecord | undefined> => {
    return await db.assessments.get(id);
  },

  /**
   * ➕ ADD NEW ASSESSMENT (Create API)
   */
  createAssessment: async (formData: AssessmentFormData): Promise<number> => {
    const recordToSave: AssessmentRecord = {
      ...formData,
      caseName: `Intake_${Math.floor(1000 + Math.random() * 9000)} (${formData.name || 'Unknown'})`,
      childIsSafe: formData.capacities.includes('Child Is Safe At Home') ? 'Yes' : 'No',
      dateCompleted: formData.isCompleted 
        ? (formData.dateCompleted || new Date().toISOString().split('T')[0]) 
        : 'Pending'
    };
    return await db.assessments.add(recordToSave);
  },

  /**
 * ❌ DELETE ASSESSMENT BY ID
 */
deleteAssessment: async (id: number): Promise<void> => {
  return await db.assessments.delete(id);
},
  /**
   * ✏️ EDIT / UPDATE ASSESSMENT (Update API)
   */
updateAssessment: async (id: number, formData: AssessmentFormData): Promise<number> => {
  // ১. প্রথমে আপনার formData থেকে সরাসরি name বা caseName যা আছে তা ডি-স্ট্রাকচার করে নিন
  // (যদি আপনার formData-র ভেতর নাম অন্য কোনো নামে থাকে, যেমন clientName বা identifier, তবে সেটা এখানে দিন)
  const { name, caseName } = formData as any; 

  const updatedRecord: Partial<AssessmentRecord> = {
    ...formData,
    // ২. এখানে স্পষ্টভাবে এসাইন করে দিন যাতে Dexie বুঝতে পারে কোন কলাম আপডেট হচ্ছে
    name: name || (formData as any).name, 
    caseName: caseName || (formData as any).caseName || name, // caseName না থাকলে নাম-কেই কেস নেম বানিয়ে দেবে
    
    childIsSafe: formData.capacities.includes('Child Is Safe At Home') ? 'Yes' : 'No',
    dateCompleted: formData.isCompleted 
      ? (formData.dateCompleted || new Date().toISOString().split('T')[0]) 
      : 'Pending'
  };

  // কনসোলে চেক করার জন্য (ডেবাগিং এর সুবিধার্থে)
  console.log("Updating Dexie Record with payload:", updatedRecord);

  return await db.assessments.update(id, updatedRecord);
}
  
};