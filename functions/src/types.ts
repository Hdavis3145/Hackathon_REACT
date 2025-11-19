import { z } from "zod";

// Firestore document types
export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  pillType: string;
  imageUrl: string;
  times: string[];
  pillsRemaining?: number;
  refillThreshold?: number;
  lastRefillDate?: Date | null;
}

export interface MedicationLog {
  id: string;
  userId: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  takenTime?: Date | null;
  status: string;
  confidence?: number | null;
  scannedPillType?: string | null;
  createdAt: Date;
}

export interface NotificationSubscription {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  expirationTime?: Date | null;
  createdAt: Date;
}

export interface MedicationSurvey {
  id: string;
  userId: string;
  medicationLogId: string;
  medicationName: string;
  hasDizziness: number;
  hasPain: number;
  painLevel?: number | null;
  appetiteLevel: string;
  notes?: string | null;
  createdAt: Date;
}

export interface Caregiver {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: number;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: string;
  caregiverId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Zod validation schemas
export const insertMedicationSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().min(1),
  pillType: z.string().min(1),
  imageUrl: z.string().url(),
  times: z.array(z.string()),
  pillsRemaining: z.number().optional(),
  refillThreshold: z.number().optional(),
  lastRefillDate: z.date().optional(),
});

export const updateMedicationSchema = insertMedicationSchema.partial();

export const insertMedicationLogSchema = z.object({
  medicationId: z.string(),
  medicationName: z.string(),
  scheduledTime: z.string(),
  takenTime: z.string().datetime().or(z.date()).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ).optional(),
  status: z.string(),
  confidence: z.number().optional(),
  scannedPillType: z.string().optional(),
});

export const insertNotificationSubscriptionSchema = z.object({
  userId: z.string(),
  endpoint: z.string(),
  p256dh: z.string(),
  auth: z.string(),
  expirationTime: z.date().optional(),
});

export const insertMedicationSurveySchema = z.object({
  medicationLogId: z.string(),
  medicationName: z.string(),
  hasDizziness: z.number().min(0).max(1),
  hasPain: z.number().min(0).max(1),
  painLevel: z.number().min(0).max(10).optional(),
  appetiteLevel: z.enum(['good', 'reduced', 'none']),
  notes: z.string().optional(),
});

export const insertCaregiverSchema = z.object({
  name: z.string().min(2),
  relationship: z.string().min(1),
  phone: z.string().min(10),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  isPrimary: z.number().min(0).max(1).optional(),
});

export const updateCaregiverSchema = insertCaregiverSchema.partial();

// Type exports
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type UpdateMedication = z.infer<typeof updateMedicationSchema>;
export type InsertMedicationLog = z.infer<typeof insertMedicationLogSchema>;
export type InsertNotificationSubscription = z.infer<typeof insertNotificationSubscriptionSchema>;
export type InsertMedicationSurvey = z.infer<typeof insertMedicationSurveySchema>;
export type InsertCaregiver = z.infer<typeof insertCaregiverSchema>;
export type UpdateCaregiver = z.infer<typeof updateCaregiverSchema>;
