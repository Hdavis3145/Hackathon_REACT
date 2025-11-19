# Medication Survey Feature Guide

## Overview

SmartAid includes a **post-medication survey** that asks elderly users about their condition after taking medicine. This helps caregivers monitor side effects and track medication effectiveness.

---

## How It Works

### For Elderly Users:

1. **Scan Your Pill**
   - Open the app and tap "Scan Medication"
   - Point camera at pill and take a photo
   - AI identifies the pill

2. **Log the Dose**
   - App automatically logs that you took the medication
   - Shows success message

3. **Complete the Survey**
   - A survey appears asking how you feel
   - Answer three simple questions:
     - **Are you feeling dizzy?** (Yes/No)
     - **Do you have pain?** (Yes/No)
       - If yes, rate pain 1-10 (1 = mild, 10 = severe)
     - **How is your appetite?** (Good/Reduced/None)
   - Optional: Add notes about other symptoms

4. **Submit**
   - Tap "Submit" to save your answers
   - You can tap "Skip" if you don't want to answer

---

## Survey Questions

### Question 1: Dizziness
- **Question**: "Are you feeling dizzy?"
- **Options**: Yes / No
- **Purpose**: Detect potential side effects that could cause falls

### Question 2: Pain
- **Question**: "Do you have pain?"
- **Options**: Yes / No
- **Follow-up**: If "Yes", select pain level 1-10
  - 1-3: Mild pain
  - 4-6: Moderate pain
  - 7-10: Severe pain
- **Purpose**: Monitor pain levels and medication effectiveness

### Question 3: Appetite
- **Question**: "How is your appetite?"
- **Options**: 
  - **Good**: Normal appetite
  - **Reduced**: Less hungry than usual
  - **None**: No appetite at all
- **Purpose**: Track appetite changes (common medication side effect)

### Optional: Additional Notes
- Free-text field for any other symptoms or feelings
- Examples:
  - "Feeling tired"
  - "Slight headache"
  - "Nausea after taking pill"

---

## Accessibility Features

The survey is designed specifically for elderly users:

### Large Text
- ✅ **Headings**: 48pt+ (very large, easy to read)
- ✅ **Questions**: 24pt (large and clear)
- ✅ **Buttons**: 20pt text (easy to read)
- ✅ **Descriptions**: 20pt (comfortable reading size)

### Large Touch Targets
- ✅ **All buttons**: 64px height (easy to tap)
- ✅ **Pain level buttons**: 64px height (numbered 1-10)
- ✅ **Spacing**: 16px gaps between buttons (prevents mis-taps)

### High Contrast
- ✅ **Selected buttons**: Dark background with white text
- ✅ **Unselected buttons**: White background with dark text
- ✅ **Visual feedback**: Checkmark appears when selected

### Simple Layout
- ✅ **One question at a time**: Not overwhelming
- ✅ **Clear options**: Yes/No, numbered scales
- ✅ **Icons**: Visual indicators for each question
- ✅ **Grid layout**: Organized and easy to scan

---

## Data Storage

Survey responses are saved to Firestore:

```javascript
{
  id: "unique-id",
  userId: "default-user",
  medicationLogId: "log-id",
  medicationName: "Aspirin",
  hasDizziness: 0,          // 0 = No, 1 = Yes
  hasPain: 1,               // 0 = No, 1 = Yes
  painLevel: 6,             // 1-10 scale (null if no pain)
  appetiteLevel: "reduced", // "good", "reduced", or "none"
  notes: "Slight headache", // Optional text
  createdAt: "2025-01-15T10:30:00Z"
}
```

---

## API Endpoints

### Submit Survey
```http
POST /api/surveys
Content-Type: application/json

{
  "medicationLogId": "abc123",
  "medicationName": "Aspirin",
  "hasDizziness": 0,
  "hasPain": 1,
  "painLevel": 5,
  "appetiteLevel": "good",
  "notes": "Feeling better"
}
```

**Response:**
```json
{
  "id": "survey-id",
  "userId": "default-user",
  "medicationLogId": "abc123",
  "medicationName": "Aspirin",
  "hasDizziness": 0,
  "hasPain": 1,
  "painLevel": 5,
  "appetiteLevel": "good",
  "notes": "Feeling better",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

### Get All Surveys
```http
GET /api/surveys
```

**Response:**
```json
[
  {
    "id": "survey-1",
    "medicationName": "Aspirin",
    "hasDizziness": 0,
    "hasPain": 1,
    "painLevel": 5,
    "appetiteLevel": "good",
    "createdAt": "2025-01-15T10:30:00Z"
  },
  ...
]
```

---

## For Caregivers

Caregivers can view survey responses to:

1. **Monitor Side Effects**
   - Track dizziness patterns (fall risk)
   - Monitor pain levels over time
   - Watch for appetite changes

2. **Medication Effectiveness**
   - See if pain medications are working
   - Identify medications causing problems
   - Share data with doctors

3. **Early Warning Signs**
   - Detect adverse reactions quickly
   - Identify patterns (e.g., "dizzy every morning")
   - Take action before serious issues arise

---

## Privacy & Security

- ✅ **Secure storage**: All data encrypted in Firestore
- ✅ **HIPAA considerations**: No PHI shared without consent
- ✅ **User control**: Can skip survey anytime
- ✅ **Data ownership**: User owns all health data

---

## Technical Implementation

### Component: `client/src/components/MedicationSurvey.tsx`
- Modal dialog that appears after logging medication
- Form validation ensures all required fields answered
- Responsive design for mobile and desktop

### Backend: `functions/src/index.ts`
- POST `/api/surveys` - Creates new survey response
- GET `/api/surveys` - Retrieves all survey responses
- Validation using Zod schemas

### Database: Firestore collection `medicationSurveys`
- Indexed by userId for fast queries
- Linked to medication logs via medicationLogId
- Timestamped for historical tracking

---

## Future Enhancements

Potential improvements:
- 📊 **Survey analytics dashboard** for caregivers
- 📈 **Trend charts** showing symptoms over time
- 🔔 **Alerts** for concerning patterns (e.g., severe pain)
- 📧 **Email reports** to caregivers summarizing weekly symptoms
- 🤖 **AI insights** detecting correlations between medications and symptoms

---

## Troubleshooting

### Survey doesn't appear after logging medication
- Check that medication was successfully logged
- Verify `/api/logs` endpoint is working
- Check browser console for errors

### Survey won't submit
- Ensure all three questions are answered
- Check network connection
- Verify `/api/surveys` endpoint is accessible

### Survey data not saving
- Check Firestore permissions in Firebase Console
- Verify `medicationSurveys` collection exists
- Check Firebase Functions logs for errors

---

## Support

For assistance:
1. Check application logs
2. Review Firebase Console for errors
3. Verify survey schema matches database schema
4. Test with simple survey submission via API
