import { db } from "../db/dexie";
import type { ThreatAssessment } from "../types/ThreatAssessment";

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
    return await db.threatAssessments.orderBy('createdAt').reverse().toArray();
  },

  // Get single assessment by ID
  async getAssessmentById(id: number): Promise<ThreatAssessment | undefined> {
    return await db.threatAssessments.get(id);
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
  }
};