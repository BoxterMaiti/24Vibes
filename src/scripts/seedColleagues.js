// Script to seed colleagues data into Firestore
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Function to seed colleagues from JSON file
export async function seedColleagues() {
  try {
    console.log('Starting to seed colleagues data...');
    
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
    
    // Load colleagues from JSON file
    console.log('Fetching colleagues from JSON file...');
    const response = await fetch('/Colleagues.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch colleagues: ${response.status} ${response.statusText}`);
    }
    
    const colleagues = await response.json();
    console.log(`Loaded ${colleagues.length} colleagues from JSON file`);
    
    // Add each colleague to Firestore
    const batch = [];
    for (const colleague of colleagues) {
      console.log(`Adding colleague: ${colleague.name} (${colleague.email})`);
      batch.push(setDoc(doc(db, 'colleagues', colleague.id), colleague));
    }
    
    await Promise.all(batch);
    console.log('Successfully seeded all colleagues data');
    
    return colleagues.length;
  } catch (error) {
    console.error('Error seeding colleagues:', error);
    throw error;
  }
}