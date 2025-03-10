import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  Timestamp,
  getDoc,
  doc,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Vibe, CardTemplate } from '../types';
import { getColleagueByEmail } from './colleagueService';

// Create a new vibe card
export async function createVibe(
  message: string,
  sender: string,
  recipient: string,
  category: string,
  personalMessage?: string,
  templateId?: string | null
) {
  try {
    // First check if Firestore is available
    if (!db) {
      console.error("Firestore database is not initialized");
      throw new Error("Database connection not available");
    }
    
    // Validate required fields
    if (!message || !sender || !recipient) {
      throw new Error("Missing required fields for creating a vibe");
    }
    
    // Get recipient colleague info if available
    let recipientColleague = null;
    try {
      recipientColleague = await getColleagueByEmail(recipient);
    } catch (error) {
      console.warn(`Error fetching colleague info for ${recipient}, continuing with basic info:`, error);
    }
    
    // Create a valid timestamp for createdAt
    const now = new Date();
    
    // Generate a unique ID for the document
    const vibeId = crypto.randomUUID();
    
    // Prepare the data with only valid Firestore types - strictly sanitize all fields
    const vibeData = {
      message: String(message || ''),
      sender: String(sender || ''),
      recipient: String(recipient || ''),
      category: String(category || 'Custom'),
      personalMessage: String(personalMessage || ''),
      createdAt: now.toISOString(), // Use ISO string instead of serverTimestamp
      templateId: templateId || null,
      // Add recipient details if available, ensuring all values are valid
      recipientName: recipientColleague ? 
        String(recipientColleague.name || 
         recipientColleague["display name"] || 
         recipientColleague["Display name"] || 
         (recipient.includes('@') ? recipient.split('@')[0] : recipient) || '') : 
        String(recipient.includes('@') ? recipient.split('@')[0] : recipient) || '',
      recipientDepartment: recipientColleague ? 
        String(recipientColleague.department || 
         recipientColleague.Department || '') : '',
      recipientAvatar: recipientColleague ? 
        String(recipientColleague.avatar || 
         recipientColleague["Avatar URL"] || '') : ''
    };

    console.log("Attempting to write vibe to Firestore with data:", JSON.stringify(vibeData, null, 2));

    // Try using addDoc instead of setDoc - this avoids potential permission issues with specific IDs
    try {
      const docRef = await addDoc(collection(db, 'vibes'), vibeData);
      console.log(`Created vibe with ID: ${docRef.id}`);
      
      // Return the created vibe with the document ID
      return { 
        id: docRef.id, 
        ...vibeData, 
        createdAt: now
      };
    } catch (firestoreError) {
      console.error("Firestore write error:", firestoreError);
      
      // Try a different approach with minimal data and addDoc
      try {
        console.log("Attempting with minimal data");
        const minimalData = {
          message: String(message || ''),
          sender: String(sender || ''),
          recipient: String(recipient || ''),
          createdAt: now.toISOString()
        };
        
        const docRef = await addDoc(collection(db, 'vibes'), minimalData);
        console.log(`Created vibe with minimal data, ID: ${docRef.id}`);
        
        return { 
          id: docRef.id, 
          ...minimalData, 
          createdAt: now
        };
      } catch (minimalError) {
        console.error("Even minimal data write failed:", minimalError);
        throw minimalError;
      }
    }
  } catch (error) {
    console.error('Error creating vibe:', error);
    throw error;
  }
}

// Get vibes received by a user
export async function getReceivedVibes(userEmail: string): Promise<Vibe[]> {
  try {
    // First check if Firestore is available
    if (!db) {
      console.error("Firestore database is not initialized");
      return [];
    }
    
    if (!userEmail) {
      console.warn("No user email provided to getReceivedVibes");
      return [];
    }
    
    console.log(`Getting vibes received by: ${userEmail}`);
    
    const q = query(
      collection(db, 'vibes'),
      where('recipient', '==', userEmail)
    );
    
    const querySnapshot = await getDocs(q);
    const vibes: Vibe[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      vibes.push({
        id: doc.id,
        message: data.message || '',
        sender: data.sender || '',
        recipient: data.recipient || '',
        createdAt: data.createdAt instanceof Timestamp ? 
          data.createdAt.toDate() : 
          (typeof data.createdAt === 'string' ? new Date(data.createdAt) : new Date()),
        category: data.category || '',
        personalMessage: data.personalMessage || '',
        recipientName: data.recipientName || null,
        recipientAvatar: data.recipientAvatar || null,
        recipientDepartment: data.recipientDepartment || null,
        templateId: data.templateId || null
      });
    });
    
    console.log(`Found ${vibes.length} received vibes`);
    
    // Sort by date (newest first) since we can't use orderBy with the current indexes
    return vibes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting received vibes:', error);
    return [];
  }
}

// Get vibes sent by a user
export async function getSentVibes(userEmail: string): Promise<Vibe[]> {
  try {
    // First check if Firestore is available
    if (!db) {
      console.error("Firestore database is not initialized");
      return [];
    }
    
    if (!userEmail) {
      console.warn("No user email provided to getSentVibes");
      return [];
    }
    
    console.log(`Getting vibes sent by: ${userEmail}`);
    
    const q = query(
      collection(db, 'vibes'),
      where('sender', '==', userEmail)
    );
    
    const querySnapshot = await getDocs(q);
    const vibes: Vibe[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      vibes.push({
        id: doc.id,
        message: data.message || '',
        sender: data.sender || '',
        recipient: data.recipient || '',
        createdAt: data.createdAt instanceof Timestamp ? 
          data.createdAt.toDate() : 
          (typeof data.createdAt === 'string' ? new Date(data.createdAt) : new Date()),
        category: data.category || '',
        personalMessage: data.personalMessage || '',
        recipientName: data.recipientName || null,
        recipientAvatar: data.recipientAvatar || null,
        recipientDepartment: data.recipientDepartment || null,
        templateId: data.templateId || null
      });
    });
    
    console.log(`Found ${vibes.length} sent vibes`);
    
    // Sort by date (newest first) since we can't use orderBy with the current indexes
    return vibes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting sent vibes:', error);
    return [];
  }
}

// Load templates from JSON
export async function loadTemplates(): Promise<CardTemplate[]> {
  try {
    console.log('Loading card templates from JSON...');
    
    const response = await fetch('/Card_templates.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.status} ${response.statusText}`);
    }
    
    const templates = await response.json();
    console.log(`Loaded ${templates.length} card templates`);
    
    return templates;
  } catch (error) {
    console.error('Error loading templates:', error);
    return [];
  }
}

// Get template by ID
export async function getTemplateById(templateId: string): Promise<CardTemplate | null> {
  try {
    if (!templateId) {
      return null;
    }
    
    const templates = await loadTemplates();
    return templates.find(template => template.id === templateId) || null;
  } catch (error) {
    console.error('Error getting template by ID:', error);
    return null;
  }
}