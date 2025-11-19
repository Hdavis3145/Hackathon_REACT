import * as functions from 'firebase-functions';
import express, { Request, Response } from 'express';
import cors from 'cors';
import * as storage from './storage';
import {
  insertMedicationSchema,
  updateMedicationSchema,
  insertMedicationLogSchema,
  insertNotificationSubscriptionSchema,
  insertMedicationSurveySchema,
  insertCaregiverSchema,
  updateCaregiverSchema,
} from './types';

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Default user ID for single-user deployment
const DEFAULT_USER_ID = 'default-user';

// Medications routes
app.get('/api/medications', async (req: Request, res: Response) => {
  try {
    const medications = await storage.getMedications(DEFAULT_USER_ID);
    res.json(medications);
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ error: 'Failed to fetch medications' });
  }
});

app.post('/api/medications', async (req: Request, res: Response) => {
  try {
    const validatedData = insertMedicationSchema.parse(req.body);
    const medication = await storage.createMedication(validatedData);
    res.status(201).json(medication);
  } catch (error: any) {
    console.error('Error creating medication:', error);
    res.status(400).json({ error: error.message || 'Failed to create medication' });
  }
});

app.patch('/api/medications/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateMedicationSchema.parse(req.body);
    const medication = await storage.updateMedication(id, validatedData);
    
    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    
    res.json(medication);
  } catch (error: any) {
    console.error('Error updating medication:', error);
    res.status(400).json({ error: error.message || 'Failed to update medication' });
  }
});

app.delete('/api/medications/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await storage.deleteMedication(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting medication:', error);
    res.status(500).json({ error: 'Failed to delete medication' });
  }
});

// Medication logs routes
app.get('/api/medication-logs', async (req: Request, res: Response) => {
  try {
    const logs = await storage.getMedicationLogs(DEFAULT_USER_ID);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching medication logs:', error);
    res.status(500).json({ error: 'Failed to fetch medication logs' });
  }
});

app.get('/api/medication-logs/today', async (req: Request, res: Response) => {
  try {
    const logs = await storage.getTodayMedicationLogs(DEFAULT_USER_ID);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching today\'s medication logs:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s medication logs' });
  }
});

app.post('/api/medication-logs', async (req: Request, res: Response) => {
  try {
    const validatedData = insertMedicationLogSchema.parse(req.body);
    const log = await storage.createMedicationLog(validatedData);
    res.status(201).json(log);
  } catch (error: any) {
    console.error('Error creating medication log:', error);
    res.status(400).json({ error: error.message || 'Failed to create medication log' });
  }
});

// Notification subscriptions routes
app.get('/api/notification-subscriptions', async (req: Request, res: Response) => {
  try {
    const subscriptions = await storage.getNotificationSubscriptions(DEFAULT_USER_ID);
    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

app.post('/api/notification-subscriptions', async (req: Request, res: Response) => {
  try {
    const validatedData = insertNotificationSubscriptionSchema.parse(req.body);
    const subscription = await storage.createNotificationSubscription(validatedData);
    res.status(201).json(subscription);
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    res.status(400).json({ error: error.message || 'Failed to create subscription' });
  }
});

app.delete('/api/notification-subscriptions', async (req: Request, res: Response) => {
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }
    
    await storage.deleteNotificationSubscription(endpoint);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({ error: 'Failed to delete subscription' });
  }
});

// Medication surveys routes
app.get('/api/medication-surveys', async (req: Request, res: Response) => {
  try {
    const surveys = await storage.getMedicationSurveys(DEFAULT_USER_ID);
    res.json(surveys);
  } catch (error) {
    console.error('Error fetching surveys:', error);
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

app.post('/api/medication-surveys', async (req: Request, res: Response) => {
  try {
    const validatedData = insertMedicationSurveySchema.parse(req.body);
    const survey = await storage.createMedicationSurvey(validatedData);
    res.status(201).json(survey);
  } catch (error: any) {
    console.error('Error creating survey:', error);
    res.status(400).json({ error: error.message || 'Failed to create survey' });
  }
});

// Caregivers routes
app.get('/api/caregivers', async (req: Request, res: Response) => {
  try {
    const caregivers = await storage.getCaregivers(DEFAULT_USER_ID);
    res.json(caregivers);
  } catch (error) {
    console.error('Error fetching caregivers:', error);
    res.status(500).json({ error: 'Failed to fetch caregivers' });
  }
});

app.post('/api/caregivers', async (req: Request, res: Response) => {
  try {
    const validatedData = insertCaregiverSchema.parse(req.body);
    const caregiver = await storage.createCaregiver(validatedData);
    res.status(201).json(caregiver);
  } catch (error: any) {
    console.error('Error creating caregiver:', error);
    res.status(400).json({ error: error.message || 'Failed to create caregiver' });
  }
});

app.patch('/api/caregivers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateCaregiverSchema.parse(req.body);
    const caregiver = await storage.updateCaregiver(id, validatedData);
    
    if (!caregiver) {
      return res.status(404).json({ error: 'Caregiver not found' });
    }
    
    res.json(caregiver);
  } catch (error: any) {
    console.error('Error updating caregiver:', error);
    res.status(400).json({ error: error.message || 'Failed to update caregiver' });
  }
});

app.delete('/api/caregivers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await storage.deleteCaregiver(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting caregiver:', error);
    res.status(500).json({ error: 'Failed to delete caregiver' });
  }
});

// Test notification route (for push notifications)
app.post('/api/test-notification', async (req: Request, res: Response) => {
  try {
    // This would integrate with web-push for sending notifications
    // For now, returning success
    res.json({ success: true, message: 'Notification sent' });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Export the Express app as a Cloud Function
export const api = functions.https.onRequest(app);
