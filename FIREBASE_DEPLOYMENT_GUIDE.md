# SmartAid Firebase Deployment Guide

This guide will help you deploy SmartAid to Firebase Hosting with Cloud Functions and Firestore.

## Prerequisites

1. **Node.js 20 or higher** installed on your computer
2. **Firebase project** (you have: hackathon-fall-2025)
3. **Firebase CLI** installed globally

## Step 1: Install Firebase CLI

If you haven't already:

```bash
npm install -g firebase-tools
```

## Step 2: Login to Firebase

```bash
firebase login
```

This will open a browser window for you to authenticate with your Google account.

## Step 3: Initialize Firestore Database

1. Go to your Firebase Console: https://console.firebase.google.com/project/hackathon-fall-2025
2. Click **"Firestore Database"** in the left menu
3. Click **"Create database"**
4. Choose **"Start in production mode"** (the security rules are already configured in firestore.rules)
5. Select a location closest to your users
6. Click **"Enable"**

## Step 4: Install Functions Dependencies

```bash
cd functions
npm install
cd ..
```

## Step 5: Set Environment Variables for Cloud Functions

Firebase Cloud Functions need environment variables for:
- ROBOFLOW_API_KEY
- VAPID_PUBLIC_KEY
- VAPID_PRIVATE_KEY

Set them using:

```bash
firebase functions:config:set roboflow.api_key="YOUR_ROBOFLOW_API_KEY"
firebase functions:config:set vapid.public_key="YOUR_VAPID_PUBLIC_KEY"
firebase functions:config:set vapid.private_key="YOUR_VAPID_PRIVATE_KEY"
```

## Step 6: Build the Frontend

```bash
npm run build
```

This creates a `dist` folder with your production-ready frontend.

## Step 7: Deploy to Firebase

Deploy everything at once:

```bash
firebase deploy
```

Or deploy specific parts:

```bash
# Deploy only hosting (frontend)
firebase deploy --only hosting

# Deploy only functions (backend API)
firebase deploy --only functions

# Deploy only Firestore rules
firebase deploy --only firestore:rules
```

## Step 8: Access Your Deployed App

After deployment, Firebase will provide you with a URL like:

```
https://hackathon-fall-2025.web.app
```

Your app is now live!

## Updating the App

When you make changes:

1. **Frontend changes**: Run `npm run build` then `firebase deploy --only hosting`
2. **Backend changes**: Run `cd functions && npm run build && cd ..` then `firebase deploy --only functions`
3. **Database rules**: Run `firebase deploy --only firestore:rules`

## Monitoring and Logs

View logs for your Cloud Functions:

```bash
firebase functions:log
```

Or view them in the Firebase Console:
https://console.firebase.google.com/project/hackathon-fall-2025/functions

## Important Notes

### Default User ID
The app is configured for single-user deployment with a hardcoded DEFAULT_USER_ID = 'default-user'. All data is associated with this user.

### PWA Features
- Push notifications will work on HTTPS (Firebase Hosting provides this automatically)
- Camera features will work properly
- Service worker will enable offline functionality

### Costs
- **Firestore**: Free tier includes 50K reads, 20K writes, 20K deletes per day
- **Cloud Functions**: Free tier includes 2M invocations per month
- **Hosting**: Free tier includes 10 GB storage, 360 MB/day transfer

Your SmartAid app should comfortably fit within the free tier for personal use.

## Troubleshooting

### Build Errors
If you get TypeScript errors during build:
```bash
cd functions
npm run build
```

### Deployment Fails
Check your Firebase project permissions and ensure you're logged in:
```bash
firebase login
firebase projects:list
```

### Functions Not Working
Check the logs:
```bash
firebase functions:log
```

### Database Access Issues
Verify Firestore is enabled in the Firebase Console and rules are deployed.

## Need Help?

Check the Firebase documentation:
- Hosting: https://firebase.google.com/docs/hosting
- Cloud Functions: https://firebase.google.com/docs/functions
- Firestore: https://firebase.google.com/docs/firestore
