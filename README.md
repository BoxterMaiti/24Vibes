# 24Vibes - Appreciation Platform

![24Vibes Logo](https://i.postimg.cc/Prm0LcST/24viibes-logo-0-00-00-00.png)

24Vibes is an internal appreciation platform for 24Slides employees to send recognition messages to colleagues. Currently hosted at [24vibes.netlify.app](https://24vibes.netlify.app), this documentation serves as a guide for migrating the project to 24slides.dev infrastructure.

## Current Infrastructure

- **Frontend Hosting**: Netlify (24vibes.netlify.app)
- **Database**: Firebase (Firestore)
- **Authentication**: Firebase Auth (Google Sign-in)
- **Serverless Functions**: Netlify Functions
- **Notifications**: Slack integration via webhook

## Migration Requirements

### 1. Domain Migration
To migrate from 24vibes.netlify.app to 24slides.dev:
- Configure DNS settings for the new subdomain
- Update SSL certificates
- Update environment variables with new domain
- Update OAuth redirect URIs in Google Cloud Console

### 2. Firebase Migration
Current Firebase project needs to be migrated to 24Slides organization:
- Export Firestore data
- Transfer Firebase project ownership or create new project
- Update security rules
- Migrate Google OAuth configuration

### 3. Environment Variables
Required environment variables for deployment:

```bash
# Firebase Configuration
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
FIREBASE_MEASUREMENT_ID=

# Frontend Environment Variables (with VITE_ prefix)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

# Slack Integration
SLACK_BOT_TOKEN=
SITE_URL=

# Optional: Analytics
GA_TRACKING_ID=
```

## Technical Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Styling**: Tailwind CSS 3.4.1
- **Routing**: React Router 6.22.3
- **Animations**: Framer Motion 11.0.8
- **Icons**: Lucide React 0.344.0
- **Build Tool**: Vite 5.4.2

### Backend Services
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Functions**: Currently Netlify Functions (Node.js 18)
- **Storage**: Firebase Storage (minimal usage, only favicon)

## Database Structure

### Firestore Collections

#### Vibes Collection
Stores appreciation messages.
```typescript
{
  id: string;
  message: string;
  sender: string; // Email address
  recipient: string; // Email address
  createdAt: Date;
  category?: string;
  personalMessage?: string;
  recipientName?: string;
  recipientDepartment?: string;
  recipientAvatar?: string;
  senderName?: string;
  senderDepartment?: string;
  senderAvatar?: string;
  templateId?: string;
  reactions?: Array<{
    emoji: string;
    userId: string;
    createdAt: string;
  }>;
}
```

#### Colleagues Collection
Stores user profiles.
```typescript
{
  id: string; // Matches Firebase Auth UID
  name?: string;
  email: string;
  department?: string;
  position?: string;
  avatar?: string;
  "display name"?: string;
  location?: string;
  joined?: string;
  onboardingCompleted?: boolean;
  isAdmin?: "yes" | "no";
  updatedAt?: string;
}
```

### Firestore Indexes
Required indexes for queries:
```json
{
  "indexes": [
    {
      "collectionGroup": "vibes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "recipient", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "vibes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "sender", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Security Rules
Critical security rules that must be maintained:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow @24slides.com users
    function has24SlidesEmail() {
      return request.auth != null && 
        request.auth.token.email.matches(".*@24slides.com$");
    }

    // Allow server functions to read data
    function isServerFunction() {
      return true; // Customize based on your server authentication
    }

    match /vibes/{vibeId} {
      allow read: if has24SlidesEmail() || isServerFunction();
      allow write: if has24SlidesEmail();
    }

    match /colleagues/{colleagueId} {
      allow read: if has24SlidesEmail() || isServerFunction();
      allow write: if has24SlidesEmail();
    }
  }
}
```

## Serverless Functions

Currently implemented as Netlify Functions, these need to be migrated to your preferred serverless platform:

### Slack Notification Function
- Triggered when a vibe is sent
- Sends direct message to recipient
- Requires Slack bot token
- Current implementation: `/netlify/functions/slack-notification.js`

## Build and Deployment

Current build process:
```bash
# Install dependencies
npm install

# Build frontend
npm run build

# Build functions
npm run build:functions # If using Netlify CLI
```

Build output:
- Frontend: `/dist`
- Functions: `/netlify/functions`

## Development Setup

1. Clone repository
```bash
git clone [repository-url]
cd 24vibes
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

4. Start development server
```bash
npm run dev
```

## Post-Migration Checklist

1. **Domain Configuration**
   - [ ] Configure DNS for 24slides.dev subdomain
   - [ ] Set up SSL certificate
   - [ ] Update OAuth redirect URIs

2. **Firebase Setup**
   - [ ] Create new Firebase project under 24Slides organization
   - [ ] Import Firestore data
   - [ ] Configure security rules
   - [ ] Set up Google authentication

3. **Environment**
   - [ ] Configure all environment variables
   - [ ] Update API keys and credentials
   - [ ] Configure Slack integration

4. **Testing**
   - [ ] Verify authentication flow
   - [ ] Test data migration
   - [ ] Validate Slack notifications
   - [ ] Check user permissions

## License

Internal 24Slides project - All rights reserved