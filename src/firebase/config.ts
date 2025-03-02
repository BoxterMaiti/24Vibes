import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Get Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase only if configuration is available
let app = null;
try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
  } else {
    console.error("Firebase API key is missing");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

// Initialize services
export const auth = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider
if (googleProvider) {
  googleProvider.addScope('email');
  googleProvider.addScope('profile');
}

// Initialize Firestore
export const db = app ? getFirestore(app) : null;

// Enable offline persistence (wrapped in try/catch to handle browser limitations)
if (db) {
  try {
    enableIndexedDbPersistence(db)
      .then(() => console.log("Firestore persistence enabled"))
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
          console.warn('The current browser does not support all of the features required to enable persistence');
        } else {
          console.error("Error enabling persistence:", err);
        }
      });
  } catch (error) {
    console.warn("Could not enable Firestore persistence:", error);
  }
}

// Initialize Analytics
let analytics = null;
if (app) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Analytics could not be initialized:", error);
  }
}

export { analytics };
export default app;