import * as admin from 'firebase-admin';
import type {
  Medication,
  MedicationLog,
  NotificationSubscription,
  MedicationSurvey,
  Caregiver,
  InsertMedication,
  UpdateMedication,
  InsertMedicationLog,
  InsertNotificationSubscription,
  InsertMedicationSurvey,
  InsertCaregiver,
  UpdateCaregiver,
} from './types';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Helper function to generate UUIDs
function generateId(): string {
  return db.collection('_').doc().id;
}

// Default user ID for single-user deployment
const DEFAULT_USER_ID = 'default-user';

// Medications
export async function createMedication(data: InsertMedication): Promise<Medication> {
  const id = generateId();
  const medication: Medication = {
    id,
    userId: DEFAULT_USER_ID,
    ...data,
    times: data.times || [],
    pillsRemaining: data.pillsRemaining ?? 30,
    refillThreshold: data.refillThreshold ?? 7,
    lastRefillDate: data.lastRefillDate ?? null,
  };
  
  await db.collection('medications').doc(id).set(medication);
  return medication;
}

export async function getMedications(userId: string = DEFAULT_USER_ID): Promise<Medication[]> {
  const snapshot = await db.collection('medications')
    .where('userId', '==', userId)
    .get();
  
  return snapshot.docs.map(doc => doc.data() as Medication);
}

export async function getMedicationById(id: string): Promise<Medication | null> {
  const doc = await db.collection('medications').doc(id).get();
  return doc.exists ? doc.data() as Medication : null;
}

export async function updateMedication(id: string, data: UpdateMedication): Promise<Medication | null> {
  const docRef = db.collection('medications').doc(id);
  await docRef.update(data);
  const updated = await docRef.get();
  return updated.exists ? updated.data() as Medication : null;
}

export async function deleteMedication(id: string): Promise<void> {
  await db.collection('medications').doc(id).delete();
}

// Medication Logs
export async function createMedicationLog(data: InsertMedicationLog): Promise<MedicationLog> {
  const id = generateId();
  const log: MedicationLog = {
    id,
    userId: DEFAULT_USER_ID,
    ...data,
    takenTime: data.takenTime ?? null,
    confidence: data.confidence ?? null,
    scannedPillType: data.scannedPillType ?? null,
    createdAt: new Date(),
  };
  
  await db.collection('medicationLogs').doc(id).set(log);
  return log;
}

export async function getMedicationLogs(userId: string = DEFAULT_USER_ID): Promise<MedicationLog[]> {
  const snapshot = await db.collection('medicationLogs')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => doc.data() as MedicationLog);
}

export async function getTodayMedicationLogs(userId: string = DEFAULT_USER_ID): Promise<MedicationLog[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const snapshot = await db.collection('medicationLogs')
    .where('userId', '==', userId)
    .where('createdAt', '>=', today)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => doc.data() as MedicationLog);
}

// Notification Subscriptions
export async function createNotificationSubscription(data: InsertNotificationSubscription): Promise<NotificationSubscription> {
  const id = generateId();
  const subscription: NotificationSubscription = {
    id,
    ...data,
    expirationTime: data.expirationTime ?? null,
    createdAt: new Date(),
  };
  
  await db.collection('notificationSubscriptions').doc(id).set(subscription);
  return subscription;
}

export async function getNotificationSubscriptions(userId: string): Promise<NotificationSubscription[]> {
  const snapshot = await db.collection('notificationSubscriptions')
    .where('userId', '==', userId)
    .get();
  
  return snapshot.docs.map(doc => doc.data() as NotificationSubscription);
}

export async function deleteNotificationSubscription(endpoint: string): Promise<void> {
  const snapshot = await db.collection('notificationSubscriptions')
    .where('endpoint', '==', endpoint)
    .get();
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}

// Medication Surveys
export async function createMedicationSurvey(data: InsertMedicationSurvey): Promise<MedicationSurvey> {
  const id = generateId();
  const survey: MedicationSurvey = {
    id,
    userId: DEFAULT_USER_ID,
    ...data,
    painLevel: data.painLevel ?? null,
    notes: data.notes ?? null,
    createdAt: new Date(),
  };
  
  await db.collection('medicationSurveys').doc(id).set(survey);
  return survey;
}

export async function getMedicationSurveys(userId: string = DEFAULT_USER_ID): Promise<MedicationSurvey[]> {
  const snapshot = await db.collection('medicationSurveys')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => doc.data() as MedicationSurvey);
}

// Caregivers
export async function createCaregiver(data: InsertCaregiver): Promise<Caregiver> {
  const id = generateId();
  const caregiver: Caregiver = {
    id,
    userId: DEFAULT_USER_ID,
    ...data,
    email: data.email || undefined,
    isPrimary: data.isPrimary ?? 0,
    createdAt: new Date(),
  };
  
  await db.collection('caregivers').doc(id).set(caregiver);
  return caregiver;
}

export async function getCaregivers(userId: string = DEFAULT_USER_ID): Promise<Caregiver[]> {
  const snapshot = await db.collection('caregivers')
    .where('userId', '==', userId)
    .get();
  
  return snapshot.docs.map(doc => doc.data() as Caregiver);
}

export async function updateCaregiver(id: string, data: UpdateCaregiver): Promise<Caregiver | null> {
  const docRef = db.collection('caregivers').doc(id);
  await docRef.update(data);
  const updated = await docRef.get();
  return updated.exists ? updated.data() as Caregiver : null;
}

export async function deleteCaregiver(id: string): Promise<void> {
  await db.collection('caregivers').doc(id).delete();
}
