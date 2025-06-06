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
let app = null;
let storage = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.storageBucket) {
    console.log('Initializing Firebase with storage bucket:', firebaseConfig.storageBucket);
    app = initializeApp(firebaseConfig);
    storage = getStorage(app);
    console.log('Firebase Storage initialized successfully');
  } else {
    console.error('Missing Firebase configuration:', {
      hasApiKey: !!firebaseConfig.apiKey,
      hasStorageBucket: !!firebaseConfig.storageBucket,
      storageBucket: firebaseConfig.storageBucket
    });
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // Check if Firebase Storage is configured
    if (!storage) {
      console.error('Firebase Storage not initialized. Config check:', {
        hasApiKey: !!firebaseConfig.apiKey,
        hasStorageBucket: !!firebaseConfig.storageBucket,
        storageBucket: firebaseConfig.storageBucket,
        allEnvVars: Object.keys(process.env).filter(key => key.startsWith('FIREBASE_'))
      });
      
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          message: 'Firebase Storage is not configured properly',
          debug: {
            hasApiKey: !!firebaseConfig.apiKey,
            hasStorageBucket: !!firebaseConfig.storageBucket,
            storageBucket: firebaseConfig.storageBucket
          }
        })
      };
    }
    
    // Parse the request body
    let payload;
    try {
      payload = JSON.parse(event.body);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Invalid JSON in request body' })
      };
    }
    
    // Validate the payload
    if (!payload.imageData || !payload.fileName || !payload.contentType) {
      console.error('Missing required fields:', {
        hasImageData: !!payload.imageData,
        hasFileName: !!payload.fileName,
        hasContentType: !!payload.contentType
      });
      
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Missing required fields: imageData, fileName, contentType' })
      };
    }

    // Validate content type
    if (!payload.contentType.startsWith('image/')) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Invalid file type. Only images are allowed.' })
      };
    }

    // Convert base64 to buffer
    let imageBuffer;
    try {
      imageBuffer = Buffer.from(payload.imageData, 'base64');
      console.log('Image buffer created, size:', imageBuffer.length, 'bytes');
    } catch (bufferError) {
      console.error('Error creating buffer from base64:', bufferError);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Invalid base64 image data' })
      };
    }
    
    // Validate file size (max 5MB)
    if (imageBuffer.length > 5 * 1024 * 1024) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'File size too large. Maximum 5MB allowed.' })
      };
    }

    // Create a unique filename
    const timestamp = Date.now();
    const fileExtension = payload.fileName.split('.').pop() || 'jpg';
    const uniqueFileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = `slack-images/${uniqueFileName}`;

    console.log('Attempting to upload to path:', filePath);

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

    console.log('Starting upload with metadata:', metadata);
    
    try {
      const snapshot = await uploadBytes(storageRef, imageBuffer, metadata);
      console.log('Upload successful, getting download URL...');
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', downloadURL);
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: 'Image uploaded successfully',
          imageUrl: downloadURL,
          fileName: uniqueFileName,
          filePath: filePath
        })
      };
    } catch (uploadError) {
      console.error('Upload error details:', {
        error: uploadError,
        message: uploadError.message,
        code: uploadError.code,
        stack: uploadError.stack
      });
      
      // Check if it's a permissions error
      if (uploadError.code === 'storage/unauthorized') {
        return {
          statusCode: 403,
          headers: {
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ 
            message: 'Storage permissions error. Check Firebase Storage rules.',
            error: uploadError.message
          })
        };
      }
      
      throw uploadError; // Re-throw to be caught by outer catch
    }
    
  } catch (error) {
    console.error('Error uploading image:', {
      error: error,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        message: 'Internal Server Error', 
        error: error.message,
        code: error.code || 'unknown'
      })
    };
  }
};