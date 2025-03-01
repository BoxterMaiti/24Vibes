import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "SAMPLE",
  authDomain: "SAMPLE",
  projectId: "SAMPLE",
  storageBucket: "SAMPLE",
  messagingSenderId: "SAMPLE",
  appId: "SAMPLE",
  measurementId: "SAMPLE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Initialize Firestore
export const db = getFirestore(app);

// Enable offline persistence (wrapped in try/catch to handle browser limitations)
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

// Initialize Analytics
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.warn("Analytics could not be initialized:", error);
}

export { analytics };
export default app;