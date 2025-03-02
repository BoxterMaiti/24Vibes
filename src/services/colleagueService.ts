import { collection, query, where, getDocs, setDoc, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Colleague } from '../types';

// Load colleagues from Firestore
export async function loadColleagues(): Promise<Colleague[]> {
  try {
    console.log('Loading colleagues from Firestore...');
    
    // First check if Firestore is available
    if (!db) {
      console.error("Firestore database is not initialized");
      return await loadColleaguesFromJson();
    }
    
    const colleaguesCollection = collection(db, 'colleagues');
    const snapshot = await getDocs(colleaguesCollection);
    
    if (snapshot.empty) {
      console.log('No colleagues found in Firestore, loading from JSON...');
      return await loadColleaguesFromJson();
    }
    
    // If colleagues exist in Firestore, return them
    const colleagues: Colleague[] = [];
    snapshot.forEach(doc => {
      // Keep the original data structure to ensure all fields are preserved
      const data = doc.data();
      colleagues.push({
        id: doc.id,
        ...data
      } as Colleague);
    });
    
    console.log(`Loaded ${colleagues.length} colleagues from Firestore`);
    return colleagues;
  } catch (error) {
    console.error('Error loading colleagues from Firestore:', error);
    // Try to load from JSON as fallback
    return await loadColleaguesFromJson();
  }
}

// Load colleagues directly from JSON without saving to Firestore
export async function loadColleaguesFromJson(): Promise<Colleague[]> {
  try {
    console.log('Loading colleagues directly from JSON...');
    
    // Try multiple possible locations for the JSON file
    const possiblePaths = [
      '/Colleagues.json',
      './Colleagues.json',
      '../Colleagues.json',
      '/public/Colleagues.json',
      './public/Colleagues.json'
    ];
    
    let response = null;
    let successPath = '';
    
    // Try each path until we find one that works
    for (const path of possiblePaths) {
      try {
        console.log(`Attempting to load from: ${path}`);
        const resp = await fetch(path);
        if (resp.ok) {
          response = resp;
          successPath = path;
          break;
        }
      } catch (e) {
        console.log(`Failed to load from ${path}:`, e);
      }
    }
    
    if (!response) {
      console.error('Could not find Colleagues.json in any location');
      return [];
    }
    
    console.log(`Successfully loaded from: ${successPath}`);
    const data = await response.json();
    
    // Preserve the original data structure
    const colleagues: Colleague[] = data.map((item: any) => ({
      id: item.id || crypto.randomUUID(),
      ...item
    }));
    
    console.log(`Loaded ${colleagues.length} colleagues from JSON file`);
    return colleagues;
  } catch (error) {
    console.error('Error loading colleagues from JSON:', error);
    return [];
  }
}

// Get colleague by email
export async function getColleagueByEmail(email: string): Promise<Colleague | null> {
  try {
    if (!email) {
      console.warn('No email provided to getColleagueByEmail');
      return null;
    }
    
    // First check if Firestore is available
    if (!db) {
      console.warn("Firestore database is not initialized, falling back to JSON lookup");
      // Try to find colleague in JSON
      const colleagues = await loadColleaguesFromJson();
      return colleagues.find(c => c.email && c.email.toLowerCase() === email.toLowerCase()) || null;
    }
    
    const q = query(collection(db, 'colleagues'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`No exact match found for email: ${email}, trying case-insensitive search`);
      // Try case-insensitive search as fallback
      const allColleagues = await loadColleagues();
      return allColleagues.find(c => c.email && c.email.toLowerCase() === email.toLowerCase()) || null;
    }
    
    const docData = querySnapshot.docs[0].data();
    
    // Return the original data structure
    return {
      id: querySnapshot.docs[0].id,
      ...docData
    } as Colleague;
  } catch (error) {
    console.error('Error getting colleague by email:', error);
    // Try to find colleague in JSON as fallback
    try {
      const colleagues = await loadColleaguesFromJson();
      const colleague = colleagues.find(c => c.email && c.email.toLowerCase() === email.toLowerCase()) || null;
      if (!colleague) {
        console.log(`No colleague found with email: ${email} in JSON fallback`);
      }
      return colleague;
    } catch (jsonError) {
      console.error('Fallback lookup failed:', jsonError);
      return null;
    }
  }
}

// Create a new colleague in the database
export async function createColleague(email: string, displayName?: string, photoURL?: string): Promise<Colleague | null> {
  try {
    if (!email) {
      console.warn('No email provided to createColleague');
      return null;
    }
    
    // First check if Firestore is available
    if (!db) {
      console.error("Firestore database is not initialized");
      return null;
    }
    
    // Check if colleague already exists
    const existingColleague = await getColleagueByEmail(email);
    if (existingColleague) {
      console.log(`Colleague with email ${email} already exists`);
      
      // If the colleague exists but doesn't have an avatar and we have a photoURL, update it
      if (photoURL && !existingColleague.avatar) {
        try {
          await updateDoc(doc(db, 'colleagues', existingColleague.id), {
            avatar: photoURL,
            updatedAt: new Date().toISOString()
          });
          
          console.log(`Updated avatar for existing colleague: ${existingColleague.name} (${email})`);
          return {
            ...existingColleague,
            avatar: photoURL
          };
        } catch (updateError) {
          console.error('Error updating colleague avatar:', updateError);
        }
      }
      
      return existingColleague;
    }
    
    // Generate a unique ID for the new colleague
    const colleagueId = crypto.randomUUID();
    
    // Create a new colleague object
    const newColleague: Colleague = {
      id: colleagueId,
      email: email,
      name: displayName || email.split('@')[0],
      "display name": displayName || email.split('@')[0],
      department: "New User",
      position: "Team Member",
      joined: new Date().toISOString()
    };
    
    // Add avatar if provided
    if (photoURL) {
      newColleague.avatar = photoURL;
    }
    
    // Add to Firestore
    await setDoc(doc(db, 'colleagues', colleagueId), newColleague);
    
    console.log(`Created new colleague: ${newColleague.name} (${email})`);
    return newColleague;
  } catch (error) {
    console.error('Error creating colleague:', error);
    return null;
  }
}

// Update colleague profile
export async function updateColleagueProfile(
  userId: string, 
  profileData: Partial<Colleague>
): Promise<boolean> {
  try {
    if (!userId) {
      console.warn('No userId provided to updateColleagueProfile');
      return false;
    }
    
    // First check if Firestore is available
    if (!db) {
      console.error("Firestore database is not initialized");
      return false;
    }
    
    // Get the colleague ID from the user-colleague mapping
    const mappingDoc = await getDoc(doc(db, 'userColleagues', userId));
    
    if (!mappingDoc.exists()) {
      console.warn(`No mapping found for user: ${userId}`);
      return false;
    }
    
    const mapping = mappingDoc.data();
    const colleagueId = mapping.colleagueId;
    
    // Get the current colleague data
    const colleagueDoc = await getDoc(doc(db, 'colleagues', colleagueId));
    
    if (!colleagueDoc.exists()) {
      console.warn(`Colleague not found with id: ${colleagueId}`);
      return false;
    }
    
    const currentData = colleagueDoc.data();
    
    // Merge the current data with the new profile data
    const updatedData = {
      ...currentData,
      ...profileData,
      updatedAt: new Date().toISOString()
    };
    
    // Update the colleague document
    await setDoc(doc(db, 'colleagues', colleagueId), updatedData);
    
    console.log(`Updated profile for colleague: ${colleagueId}`);
    return true;
  } catch (error) {
    console.error('Error updating colleague profile:', error);
    return false;
  }
}

// Link user account with colleague
export async function linkUserToColleague(userId: string, email: string, photoURL?: string): Promise<boolean> {
  try {
    if (!userId || !email) {
      console.warn('Missing userId or email for linkUserToColleague');
      return false;
    }
    
    // First check if Firestore is available
    if (!db) {
      console.error("Firestore database is not initialized");
      return false;
    }
    
    // Find colleague by email
    let colleague = await getColleagueByEmail(email);
    
    // If no colleague found, create a new one
    if (!colleague) {
      console.log(`No colleague found with email: ${email}, creating new colleague`);
      colleague = await createColleague(email, undefined, photoURL);
      
      if (!colleague) {
        console.error(`Failed to create new colleague for email: ${email}`);
        return false;
      }
    } else if (photoURL && !colleague.avatar) {
      // If colleague exists but doesn't have an avatar, update it
      try {
        await updateDoc(doc(db, 'colleagues', colleague.id), {
          avatar: photoURL,
          updatedAt: new Date().toISOString()
        });
        colleague.avatar = photoURL;
        console.log(`Updated avatar for colleague: ${colleague.name} (${email})`);
      } catch (updateError) {
        console.error('Error updating colleague avatar:', updateError);
      }
    }
    
    // Check if mapping already exists
    const mappingDoc = await getDoc(doc(db, 'userColleagues', userId));
    
    if (mappingDoc.exists()) {
      // Mapping exists, just update it if needed
      const existingData = mappingDoc.data();
      if (existingData.colleagueId !== colleague.id || existingData.email !== email) {
        await setDoc(doc(db, 'userColleagues', userId), {
          ...existingData,
          colleagueId: colleague.id,
          email: email,
          updatedAt: new Date().toISOString()
        });
      }
    } else {
      // Create new user-colleague mapping
      await setDoc(doc(db, 'userColleagues', userId), {
        colleagueId: colleague.id,
        email: email,
        isAdmin: "no", // Default to non-admin
        linkedAt: new Date().toISOString()
      });
    }
    
    const displayName = colleague.name || colleague["display name"] || colleague["Display name"] || email;
    console.log(`Linked user ${userId} to colleague ${displayName} (${colleague.email})`);
    return true;
  } catch (error) {
    console.error('Error linking user to colleague:', error);
    return false;
  }
}

// Get colleague by user ID
export async function getColleagueByUserId(userId: string): Promise<Colleague | null> {
  try {
    if (!userId) {
      console.warn('No userId provided to getColleagueByUserId');
      return null;
    }
    
    // First check if Firestore is available
    if (!db) {
      console.error("Firestore database is not initialized");
      return null;
    }
    
    // Get the mapping
    const mappingDoc = await getDoc(doc(db, 'userColleagues', userId));
    
    if (!mappingDoc.exists()) {
      console.warn(`No mapping found for user: ${userId}`);
      return null;
    }
    
    const mapping = mappingDoc.data();
    
    // Get the colleague
    const colleagueDoc = await getDoc(doc(db, 'colleagues', mapping.colleagueId));
    
    if (!colleagueDoc.exists()) {
      console.warn(`Colleague not found with id: ${mapping.colleagueId}`);
      return null;
    }
    
    const data = colleagueDoc.data();
    
    // Return the original data structure
    return {
      id: colleagueDoc.id,
      ...data
    } as Colleague;
  } catch (error) {
    console.error('Error getting colleague by user ID:', error);
    return null;
  }
}

// Check if user is admin
export async function checkUserIsAdmin(userId: string): Promise<boolean> {
  try {
    if (!userId) {
      console.warn('No userId provided to checkUserIsAdmin');
      return false;
    }
    
    // First check if Firestore is available
    if (!db) {
      console.error("Firestore database is not initialized");
      return false;
    }
    
    // Get the mapping
    const mappingDoc = await getDoc(doc(db, 'userColleagues', userId));
    
    if (!mappingDoc.exists()) {
      console.warn(`No mapping found for user: ${userId}`);
      return false;
    }
    
    const mapping = mappingDoc.data();
    
    // Check if isAdmin field exists and is set to "yes"
    return mapping.isAdmin === "yes";
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Get all users with their admin status
export async function getAllUsers(): Promise<Array<{
  userId: string;
  email: string;
  colleagueId: string;
  isAdmin: boolean;
  colleague: Colleague | null;
  photoURL?: string;
}>> {
  try {
    // First check if Firestore is available
    if (!db) {
      console.error("Firestore database is not initialized");
      return [];
    }
    
    // Get all user-colleague mappings
    const mappingsCollection = collection(db, 'userColleagues');
    const snapshot = await getDocs(mappingsCollection);
    
    if (snapshot.empty) {
      console.log('No users found');
      return [];
    }
    
    // Process each mapping
    const usersPromises = snapshot.docs.map(async (docSnapshot) => {
      try {
        const data = docSnapshot.data() || {};
        const userId = docSnapshot.id;
        const colleagueId = data.colleagueId || '';
        const email = data.email || '';
        const isAdmin = data.isAdmin === "yes";
        
        // Get colleague data
        let colleague = null;
        try {
          if (colleagueId) {
            const colleagueDoc = await getDoc(doc(db, 'colleagues', colleagueId));
            if (colleagueDoc.exists()) {
              colleague = {
                id: colleagueDoc.id,
                ...colleagueDoc.data()
              } as Colleague;
            } else {
              console.warn(`Colleague document not found for ID: ${colleagueId}`);
            }
          } else {
            console.warn(`No colleagueId found for user: ${userId}`);
          }
        } catch (colleagueError) {
          console.error(`Error getting colleague for user ${userId}:`, colleagueError);
        }
        
        // Get Firebase Auth user data to get photoURL if available
        let photoURL = undefined;
        try {
          // We can't directly access Firebase Auth user data here,
          // but we can use the colleague's avatar if it exists
          if (colleague && colleague.avatar) {
            photoURL = colleague.avatar;
          }
        } catch (authError) {
          console.error(`Error getting auth data for user ${userId}:`, authError);
        }
        
        return {
          userId,
          email,
          colleagueId,
          isAdmin,
          colleague,
          photoURL
        };
      } catch (userError) {
        console.error(`Error processing user ${docSnapshot.id}:`, userError);
        // Return a default user object to prevent the Promise.all from failing
        return {
          userId: docSnapshot.id,
          email: '',
          colleagueId: '',
          isAdmin: false,
          colleague: null
        };
      }
    });
    
    try {
      const users = await Promise.all(usersPromises);
      console.log(`Loaded ${users.length} users`);
      return users;
    } catch (promiseError) {
      console.error('Error resolving user promises:', promiseError);
      // If Promise.all fails, try to process users one by one
      const users = [];
      for (const docSnapshot of snapshot.docs) {
        try {
          const data = docSnapshot.data() || {};
          const userId = docSnapshot.id;
          users.push({
            userId,
            email: data.email || '',
            colleagueId: data.colleagueId || '',
            isAdmin: data.isAdmin === "yes",
            colleague: null // Skip loading colleague data in fallback mode
          });
        } catch (fallbackError) {
          console.error(`Error in fallback processing for user ${docSnapshot.id}:`, fallbackError);
        }
      }
      console.log(`Loaded ${users.length} users in fallback mode`);
      return users;
    }
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

// Update user admin status
export async function updateUserAdminStatus(userId: string, isAdmin: boolean): Promise<boolean> {
  try {
    if (!userId) {
      console.warn('No userId provided to updateUserAdminStatus');
      return false;
    }
    
    // First check if Firestore is available
    if (!db) {
      console.error("Firestore database is not initialized");
      return false;
    }
    
    // Get the mapping document
    const userRef = doc(db, 'userColleagues', userId);
    const mappingDoc = await getDoc(userRef);
    
    if (!mappingDoc.exists()) {
      console.warn(`No mapping found for user: ${userId}`);
      return false;
    }
    
    // Update the isAdmin field
    await updateDoc(userRef, {
      isAdmin: isAdmin ? "yes" : "no",
      updatedAt: new Date().toISOString()
    });
    
    console.log(`Updated admin status for user ${userId} to ${isAdmin ? "yes" : "no"}`);
    return true;
  } catch (error) {
    console.error('Error updating user admin status:', error);
    return false;
  }
}

// Reseed colleagues from JSON to Firestore
export async function reseedColleagues(): Promise<Colleague[]> {
  try {
    console.log('Starting to reseed colleagues data...');
    
    // First check if Firestore is available
    if (!db) {
      console.error("Firestore database is not initialized");
      return await loadColleaguesFromJson();
    }
    
    // Load colleagues from JSON file
    const colleagues = await loadColleaguesFromJson();
    
    if (colleagues.length === 0) {
      console.warn('No colleagues found in JSON file');
      return [];
    }
    
    // First, clear existing colleagues collection
    const colleaguesCollection = collection(db, 'colleagues');
    const snapshot = await getDocs(colleaguesCollection);
    
    console.log(`Found ${snapshot.size} existing colleagues in Firestore`);
    
    // Delete existing documents
    const deletePromises = [];
    snapshot.forEach(document => {
      console.log(`Deleting colleague: ${document.id}`);
      deletePromises.push(deleteDoc(doc(db, 'colleagues', document.id)));
    });
    
    await Promise.all(deletePromises);
    console.log('Cleared existing colleagues collection');
    
    // Add each colleague to Firestore
    const batch = [];
    for (const colleague of colleagues) {
      const displayName = colleague.name || colleague["display name"] || colleague["Display name"] || colleague.email;
      console.log(`Adding colleague: ${displayName} (${colleague.email})`);
      batch.push(setDoc(doc(db, 'colleagues', colleague.id), colleague));
    }
    
    await Promise.all(batch);
    console.log('Successfully reseeded all colleagues data');
    
    return colleagues;
  } catch (error) {
    console.error('Error reseeding colleagues:', error);
    // Return colleagues from JSON as fallback
    return await loadColleaguesFromJson();
  }
}