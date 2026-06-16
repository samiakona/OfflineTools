// threatAssessmentService.ts

import { db } from "../hooks/dexie";
import type { ThreatAssessment } from "../hooks/dexie"; // Import from your dexie file

// Define the SafetyThresholdLookup type
interface SafetyThresholdLookup {
  id: number;
  description: string;
}

// Static safety threshold options (since we don't have a separate table)
const SAFETY_THRESHOLD_OPTIONS: SafetyThresholdLookup[] = [
  { id: 1, description: 'Severe Consequences For The Child' },
  { id: 2, description: 'Immediate Or Will Occur In Near Future' },
  { id: 3, description: 'Vulnerabilty' },
  { id: 4, description: 'Out-Of-Control: No Adult In Household To Prevent' },
  { id: 5, description: 'Behaviors, Conditions Are Specific, Observable And Clearly Understood' }
];

export const threatAssessmentService = {
  // Create new assessment
  async createAssessment(data: Omit<ThreatAssessment, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const now = new Date().toISOString();
    const id = await db.threatAssessments.add({
      ...data,
      createdAt: now,
      updatedAt: now
    });
    return id;
  },

  // Get all assessments
  async getAllAssessments(): Promise<ThreatAssessment[]> {
    const results = await db.threatAssessments.orderBy('createdAt').reverse().toArray();
    return results;
  },

  // Get single assessment by ID
  async getAssessmentById(id: number): Promise<ThreatAssessment | undefined> {
    const result = await db.threatAssessments.get(id);
    return result;
  },

  // Update assessment
  async updateAssessment(id: number, data: Partial<ThreatAssessment>): Promise<number> {
    const updated = await db.threatAssessments.update(id, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return updated;
  },

  // Delete assessment
  async deleteAssessment(id: number): Promise<void> {
    await db.threatAssessments.delete(id);
  },

  // Toggle completion status
  async toggleCompletion(id: number, isCompleted: boolean): Promise<number> {
    return await db.threatAssessments.update(id, {
      isCompleted,
      updatedAt: new Date().toISOString(),
      dateCompleted: isCompleted ? new Date().toISOString().split('T')[0] : ''
    });
  },

  // NEW: Get safety threshold options
  async getSafetyThresholdOptions(): Promise<SafetyThresholdLookup[]> {
    // Return the static options
    // You can also add caching or fetch from a separate table if needed
    return SAFETY_THRESHOLD_OPTIONS;
  },

  // Helper: Get description by ID
  async getSafetyThresholdDescription(id: number): Promise<string> {
    const option = SAFETY_THRESHOLD_OPTIONS.find(opt => opt.id === id);
    return option ? option.description : '';
  },

  // Helper: Get ID by description
  async getSafetyThresholdId(description: string): Promise<number> {
    const option = SAFETY_THRESHOLD_OPTIONS.find(opt => opt.description === description);
    return option ? option.id : 0;
  },

  // Helper: Get label for display (handles both ID and description)
  getSafetyThresholdLabel(value: string): string {
    // Try to find by description
    const byDescription = SAFETY_THRESHOLD_OPTIONS.find(opt => opt.description === value);
    if (byDescription) return byDescription.description;
    
    // Try to find by ID (if value is a number string)
    const byId = SAFETY_THRESHOLD_OPTIONS.find(opt => opt.id === Number(value));
    if (byId) return byId.description;
    
    // Return the value itself if no match
    return value || '';
  },

  // NEW: Get all options as select options (for CustomSelect)
  getSelectOptions(): { value: string; label: string }[] {
    return SAFETY_THRESHOLD_OPTIONS.map(opt => ({
      value: opt.description, // or opt.id.toString() if you want to store IDs
      label: opt.description
    }));
  }
};