const { initializeApp } = require("firebase/app");
const { getStorage, ref, uploadBytes, getDownloadURL } = require("firebase/storage");

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase only if configuration is available
const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null;
const storage = app ? getStorage(app) : null;

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  try {
    // Check if Firebase Storage is configured
    if (!storage) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Firebase Storage is not configured properly' })
      };
    }
    
    // Parse the request body
    const payload = JSON.parse(event.body);
    
    // Validate the payload
    if (!payload.imageData || !payload.fileName || !payload.contentType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: imageData, fileName, contentType' })
      };
    }

    // Validate content type
    if (!payload.contentType.startsWith('image/')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid file type. Only images are allowed.' })
      };
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(payload.imageData, 'base64');
    
    // Validate file size (max 5MB)
    if (imageBuffer.length > 5 * 1024 * 1024) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'File size too large. Maximum 5MB allowed.' })
      };
    }

    // Create a unique filename
    const timestamp = Date.now();
    const fileExtension = payload.fileName.split('.').pop();
    const uniqueFileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = `slack-images/${uniqueFileName}`;

    // Create storage reference
    const storageRef = ref(storage, filePath);

    // Upload the file
    const metadata = {
      contentType: payload.contentType,
      customMetadata: {
        originalName: payload.fileName,
        uploadedAt: new Date().toISOString()
      }
    };

    const snapshot = await uploadBytes(storageRef, imageBuffer, metadata);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Image uploaded successfully',
        imageUrl: downloadURL,
        fileName: uniqueFileName
      })
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Internal Server Error', 
        error: error.message 
      })
    };
  }
};