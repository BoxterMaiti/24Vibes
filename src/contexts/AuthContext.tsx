import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  signInWithPopup,
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { linkUserToColleague, createColleague, checkUserIsAdmin } from '../services/colleagueService';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Check if Firebase Auth is available
    if (!auth) {
      console.error("Firebase Auth is not initialized");
      setLoading(false);
      return () => {};
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user?.email || "No user");
      
      // If a user is logged in, check if they have a 24slides.com email
      if (user && user.email) {
        // If the email is not from 24slides.com, sign them out immediately
        if (!user.email.endsWith('@24slides.com')) {
          console.log("Non-24slides.com email detected, signing out:", user.email);
          setAuthError("Only @24slides.com email addresses are allowed to sign in.");
          await signOut(auth);
          setCurrentUser(null);
          setLoading(false);
          return;
        }
        
        try {
          // This will create the colleague if they don't exist
          // Pass the photoURL to store the Google profile image
          await linkUserToColleague(user.uid, user.email, user.photoURL || undefined);
          
          // Check if user is admin
          const adminStatus = await checkUserIsAdmin(user.uid);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error("Error ensuring user is in colleagues database:", error);
        }
      }
      
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signInWithGoogle() {
    try {
      setAuthError(null);
      
      // Check if Firebase Auth is available
      if (!auth || !googleProvider) {
        throw new Error("Firebase Auth is not initialized");
      }
      
      console.log("Attempting Google sign in with popup");
      // Using popup instead of redirect for better error handling
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google sign in successful:", result.user.email);
      
      // Check if the email domain is 24slides.com
      if (result.user.email && !result.user.email.endsWith('@24slides.com')) {
        console.log("Non-24slides.com email detected, signing out:", result.user.email);
        // Sign out the user if they don't have a 24slides.com email
        await signOut(auth);
        setCurrentUser(null);
        setAuthError("Only @24slides.com email addresses are allowed to sign in.");
        return;
      }
      
      // Link user to colleague if they exist in the system
      if (result.user && result.user.email) {
        await linkUserToColleague(result.user.uid, result.user.email, result.user.photoURL || undefined);
        
        // Check if user is admin
        const adminStatus = await checkUserIsAdmin(result.user.uid);
        setIsAdmin(adminStatus);
      }
      
      setCurrentUser(result.user);
      return;
    } catch (error: any) {
      console.error("Error during Google sign in:", error);
      setAuthError(error.message || "Failed to sign in with Google");
      throw error;
    }
  }

  async function logout() {
    try {
      // Check if Firebase Auth is available
      if (!auth) {
        throw new Error("Firebase Auth is not initialized");
      }
      
      await signOut(auth);
      setAuthError(null);
      setIsAdmin(false);
    } catch (error: any) {
      console.error("Error signing out:", error);
      setAuthError(error.message || "Failed to sign out");
      throw error;
    }
  }

  const value = {
    currentUser,
    loading,
    isAdmin,
    signInWithGoogle,
    logout,
    authError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}