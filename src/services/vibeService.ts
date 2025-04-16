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
  setDoc,
  or,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Vibe, CardTemplate, Reaction } from '../types';
import { getColleagueByEmail } from './colleagueService';

// Add reaction to a vibe
export async function addReaction(vibeId: string, userId: string, emoji: string): Promise<boolean> {
  try {
    if (!db || !vibeId || !userId || !emoji) {
      console.warn('Missing required parameters');
      return false;
    }

    const reaction: Reaction = {
      emoji,
      userId,
      createdAt: new Date().toISOString()
    };

    const vibeRef = doc(db, 'vibes', vibeId);
    await updateDoc(vibeRef, {
      reactions: arrayUnion(reaction)
    });

    return true;
  } catch (error) {
    console.error('Error adding reaction:', error);
    return false;
  }
}

// Remove reaction from a vibe
export async function removeReaction(vibeId: string, userId: string, emoji: string): Promise<boolean> {
  try {
    if (!db || !vibeId || !userId || !emoji) {
      console.warn('Missing required parameters');
      return false;
    }

    const vibeRef = doc(db, 'vibes', vibeId);
    const vibeDoc = await getDoc(vibeRef);

    if (!vibeDoc.exists()) {
      console.warn('Vibe not found');
      return false;
    }

    const vibe = vibeDoc.data();
    const reactions = vibe.reactions || [];
    const reactionToRemove = reactions.find(
      (r: Reaction) => r.userId === userId && r.emoji === emoji
    );

    if (reactionToRemove) {
      await updateDoc(vibeRef, {
        reactions: arrayRemove(reactionToRemove)
      });
    }

    return true;
  } catch (error) {
    console.error('Error removing reaction:', error);
    return false;
  }
}

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
    if (!db) {
      console.error("Firestore database is not initialized");
      throw new Error("Database connection not available");
    }
    
    if (!message || !sender || !recipient) {
      throw new Error("Missing required fields for creating a vibe");
    }
    
    let recipientColleague = null;
    let senderColleague = null;
    try {
      [recipientColleague, senderColleague] = await Promise.all([
        getColleagueByEmail(recipient),
        getColleagueByEmail(sender)
      ]);
    } catch (error) {
      console.warn(`Error fetching colleague info, continuing with basic info:`, error);
    }
    
    const now = new Date();
    
    const vibeData = {
      message: String(message || ''),
      sender: String(sender || ''),
      recipient: String(recipient || ''),
      category: String(category || 'Custom'),
      personalMessage: String(personalMessage || ''),
      createdAt: now.toISOString(),
      templateId: templateId || null,
      reactions: [],
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
         recipientColleague["Avatar URL"] || '') : '',
      senderName: senderColleague ? 
        String(senderColleague.name || 
         senderColleague["display name"] || 
         senderColleague["Display name"] || 
         (sender.includes('@') ? sender.split('@')[0] : sender) || '') : 
        String(sender.includes('@') ? sender.split('@')[0] : sender) || '',
      senderDepartment: senderColleague ? 
        String(senderColleague.department || 
         senderColleague.Department || '') : '',
      senderAvatar: senderColleague ? 
        String(senderColleague.avatar || 
         senderColleague["Avatar URL"] || '') : ''
    };

    try {
      const docRef = await addDoc(collection(db, 'vibes'), vibeData);
      console.log(`Created vibe with ID: ${docRef.id}`);
      
      try {
        const isStackBlitz = window.location.hostname.includes('stackblitz');
        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1';
        
        if (!isDevelopment && !isStackBlitz) {
          console.log("Sending Slack notification");
          const response = await fetch('/.netlify/functions/slack-notification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              vibeId: docRef.id,
              recipientEmail: recipient
            }),
          });
          
          if (!response.ok) {
            console.warn('Failed to send Slack notification:', await response.text());
          } else {
            console.log("Slack notification sent successfully");
          }
        } else {
          console.log("Skipping Slack notification in development/StackBlitz environment");
        }
      } catch (notificationError) {
        console.warn('Error sending Slack notification:', notificationError);
      }
      
      return { 
        id: docRef.id, 
        ...vibeData, 
        createdAt: now
      };
    } catch (firestoreError) {
      console.error("Firestore write error:", firestoreError);
      
      try {
        console.log("Attempting with minimal data");
        const minimalData = {
          message: String(message || ''),
          sender: String(sender || ''),
          recipient: String(recipient || ''),
          createdAt: now.toISOString(),
          reactions: []
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
    if (!db || !userEmail) {
      console.warn("Database not initialized or no email provided");
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
        senderName: data.senderName || null,
        senderAvatar: data.senderAvatar || null,
        senderDepartment: data.senderDepartment || null,
        templateId: data.templateId || null,
        reactions: data.reactions || []
      });
    });
    
    console.log(`Found ${vibes.length} received vibes`);
    
    return vibes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting received vibes:', error);
    return [];
  }
}

// Get vibes sent by a user
export async function getSentVibes(userEmail: string): Promise<Vibe[]> {
  try {
    if (!db || !userEmail) {
      console.warn("Database not initialized or no email provided");
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
        senderName: data.senderName || null,
        senderAvatar: data.senderAvatar || null,
        senderDepartment: data.senderDepartment || null,
        templateId: data.templateId || null,
        reactions: data.reactions || []
      });
    });
    
    console.log(`Found ${vibes.length} sent vibes`);
    
    return vibes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting sent vibes:', error);
    return [];
  }
}

// Get all vibes for a specific user
export async function getUserVibes(userEmail: string): Promise<Vibe[]> {
  try {
    if (!db || !userEmail) {
      console.warn("Database not initialized or no email provided");
      return [];
    }
    
    console.log(`Getting all vibes for user: ${userEmail}`);
    
    const q = query(
      collection(db, 'vibes'),
      or(
        where('sender', '==', userEmail),
        where('recipient', '==', userEmail)
      )
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
        senderName: data.senderName || null,
        senderAvatar: data.senderAvatar || null,
        senderDepartment: data.senderDepartment || null,
        templateId: data.templateId || null,
        reactions: data.reactions || []
      });
    });
    
    console.log(`Found ${vibes.length} total vibes for user`);
    
    return vibes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting user vibes:', error);
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

export async function getAllVibes(): Promise<Vibe[]> {
  try {
    if (!db) {
      console.warn("Database not initialized");
      return [];
    }
    
    const snapshot = await getDocs(collection(db, 'vibes'));
    const vibes: Vibe[] = [];
    
    snapshot.forEach((doc) => {
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
        senderName: data.senderName || null,
        senderAvatar: data.senderAvatar || null,
        senderDepartment: data.senderDepartment || null,
        templateId: data.templateId || null,
        reactions: data.reactions || []
      });
    });
    
    return vibes;
  } catch (error) {
    console.error('Error getting all vibes:', error);
    return [];
  }
}