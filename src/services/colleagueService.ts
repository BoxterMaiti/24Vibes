import { collection, query, where, getDocs, setDoc, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Colleague, Location } from '../types';

// Load colleagues from Firestore
export async function loadColleagues(): Promise<Colleague[]> {
  try {
    if (!db) {
      console.error("Firestore database is not initialized");
      return [];
    }
    
    const snapshot = await getDocs(collection(db, 'colleagues'));
    
    if (snapshot.empty) {
      console.log('No colleagues found in Firestore');
      return [];
    }
    
    const colleagues: Colleague[] = [];
    snapshot.forEach(doc => {
      colleagues.push({
        id: doc.id,
        ...doc.data()
      } as Colleague);
    });
    
    console.log(`Loaded ${colleagues.length} colleagues from Firestore`);
    return colleagues;
  } catch (error) {
    console.error('Error loading colleagues from Firestore:', error);
    return [];
  }
}

// Get colleague by email
export async function getColleagueByEmail(email: string): Promise<Colleague | null> {
  try {
    if (!email || !db) {
      console.warn('No email provided or database not initialized');
      return null;
    }
    
    const emailLower = email.toLowerCase();
    const q = query(collection(db, 'colleagues'), where('email', '==', emailLower));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`No colleague found with email: ${emailLower}`);
      return null;
    }
    
    const docData = querySnapshot.docs[0].data();
    return {
      id: querySnapshot.docs[0].id,
      ...docData
    } as Colleague;
  } catch (error) {
    console.error('Error getting colleague by email:', error);
    return null;
  }
}

// Create or update colleague
export async function createColleague(userId: string, email: string, displayName?: string, photoURL?: string): Promise<Colleague | null> {
  try {
    if (!userId || !email || !db) {
      console.warn('Missing required parameters or database not initialized');
      return null;
    }
    
    const emailLower = email.toLowerCase();
    const colleagueRef = doc(db, 'colleagues', userId);
    
    // Check if colleague already exists
    const existingDoc = await getDoc(colleagueRef);
    
    const colleagueData: Colleague = {
      id: userId,
      email: emailLower,
      name: displayName || emailLower.split('@')[0],
      "display name": displayName || emailLower.split('@')[0],
      department: "New User",
      position: "Team Member",
      onboardingCompleted: false,
      isAdmin: "no",
      joined: new Date().toISOString(),
      avatar: photoURL,
      updatedAt: new Date().toISOString()
    };

    if (existingDoc.exists()) {
      // Update existing colleague
      const existingData = existingDoc.data();
      await updateDoc(colleagueRef, {
        ...existingData,
        avatar: photoURL || existingData.avatar,
        updatedAt: new Date().toISOString()
      });
      
      return {
        ...existingData,
        id: userId,
        avatar: photoURL || existingData.avatar
      } as Colleague;
    } else {
      // Create new colleague
      await setDoc(colleagueRef, colleagueData);
      console.log(`Created new colleague: ${colleagueData.name} (${emailLower})`);
      return colleagueData;
    }
  } catch (error) {
    console.error('Error creating/updating colleague:', error);
    return null;
  }
}

// Link user account with colleague
export async function linkUserToColleague(userId: string, email: string, photoURL?: string): Promise<boolean> {
  try {
    if (!userId || !email || !db) {
      console.warn('Missing required parameters or database not initialized');
      return false;
    }

    const emailLower = email.toLowerCase();
    
    // Try to find existing colleague by email first
    const existingColleague = await getColleagueByEmail(emailLower);
    
    if (existingColleague && existingColleague.id !== userId) {
      // If a colleague exists with this email but different ID, update their ID
      const oldData = existingColleague;
      await deleteDoc(doc(db, 'colleagues', oldData.id));
      await setDoc(doc(db, 'colleagues', userId), {
        ...oldData,
        id: userId,
        avatar: photoURL || oldData.avatar,
        updatedAt: new Date().toISOString()
      });
      return true;
    }
    
    // Create or update colleague document
    const colleague = await createColleague(userId, emailLower, undefined, photoURL);
    return colleague !== null;
  } catch (error) {
    console.error('Error linking user to colleague:', error);
    return false;
  }
}

// Get colleague by user ID (now the same as the document ID)
export async function getColleagueByUserId(userId: string): Promise<Colleague | null> {
  try {
    if (!userId || !db) {
      console.warn('Missing userId or database not initialized');
      return null;
    }
    
    const colleagueDoc = await getDoc(doc(db, 'colleagues', userId));
    
    if (!colleagueDoc.exists()) {
      console.warn(`No colleague found with id: ${userId}`);
      return null;
    }
    
    return {
      id: colleagueDoc.id,
      ...colleagueDoc.data()
    } as Colleague;
  } catch (error) {
    console.error('Error getting colleague by user ID:', error);
    return null;
  }
}

// Update colleague profile
export async function updateColleagueProfile(
  userId: string, 
  profileData: Partial<Colleague>
): Promise<boolean> {
  try {
    if (!userId || !db) {
      console.warn('Missing userId or database not initialized');
      return false;
    }
    
    const colleagueRef = doc(db, 'colleagues', userId);
    const colleagueDoc = await getDoc(colleagueRef);
    
    if (!colleagueDoc.exists()) {
      console.warn(`Colleague not found with id: ${userId}`);
      return false;
    }
    
    await updateDoc(colleagueRef, {
      ...profileData,
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating colleague profile:', error);
    return false;
  }
}

// Check if user is admin
export async function checkUserIsAdmin(userId: string): Promise<boolean> {
  try {
    if (!userId || !db) {
      console.warn('Missing userId or database not initialized');
      return false;
    }
    
    const colleagueDoc = await getDoc(doc(db, 'colleagues', userId));
    return colleagueDoc.exists() && colleagueDoc.data().isAdmin === "yes";
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Get all users
export async function getAllUsers(): Promise<Array<{
  userId: string;
  email: string;
  isAdmin: boolean;
  colleague: Colleague;
}>> {
  try {
    if (!db) {
      console.error("Database not initialized");
      return [];
    }
    
    const snapshot = await getDocs(collection(db, 'colleagues'));
    
    if (snapshot.empty) {
      console.log('No users found');
      return [];
    }
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        userId: doc.id,
        email: data.email || '',
        isAdmin: data.isAdmin === "yes",
        colleague: {
          id: doc.id,
          ...data
        } as Colleague
      };
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

// Update user admin status
export async function updateUserAdminStatus(userId: string, isAdmin: boolean): Promise<boolean> {
  try {
    if (!userId || !db) {
      console.warn('Missing userId or database not initialized');
      return false;
    }
    
    const colleagueRef = doc(db, 'colleagues', userId);
    const colleagueDoc = await getDoc(colleagueRef);
    
    if (!colleagueDoc.exists()) {
      console.warn(`Colleague not found with id: ${userId}`);
      return false;
    }
    
    await updateDoc(colleagueRef, {
      isAdmin: isAdmin ? "yes" : "no",
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating admin status:', error);
    return false;
  }
}