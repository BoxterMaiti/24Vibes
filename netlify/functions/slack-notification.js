const fetch = require('node-fetch');
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, getDoc } = require("firebase/firestore");

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
const db = app ? getFirestore(app) : null;

// Slack API token
const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN;

/**
 * Find a Slack user by email
 * @param {string} email - User's email address
 * @returns {Promise<string|null>} - Slack user ID or null if not found
 */
async function findSlackUserByEmail(email) {
  try {
    if (!SLACK_TOKEN) {
      console.log('No Slack token provided');
      return null;
    }
    
    const response = await fetch('https://slack.com/api/users.lookupByEmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${SLACK_TOKEN}`
      },
      body: new URLSearchParams({
        email: email
      }).toString()
    });

    const data = await response.json();
    
    if (data.ok && data.user && data.user.id) {
      return data.user.id;
    } else {
      console.log(`User not found in Slack for email ${email}:`, data.error || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.error('Error finding Slack user:', error);
    return null;
  }
}

/**
 * Send a message to a Slack user
 * @param {string} userId - Slack user ID
 * @param {object} message - Message content
 * @returns {Promise<boolean>} - Success status
 */
async function sendSlackMessage(userId, message) {
  try {
    if (!SLACK_TOKEN) {
      console.log('No Slack token provided');
      return false;
    }
    
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SLACK_TOKEN}`
      },
      body: JSON.stringify({
        channel: userId,
        ...message
      })
    });

    const data = await response.json();
    
    if (data.ok) {
      return true;
    } else {
      console.error('Error sending Slack message:', data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('Error sending Slack message:', error);
    return false;
  }
}

/**
 * Format a vibe card message for Slack
 * @param {object} vibe - Vibe card data
 * @returns {object} - Formatted Slack message
 */
function formatVibeMessage(vibe) {
  const category = vibe.category || 'Custom';
  const message = vibe.message || 'Someone sent you a vibe!';
  const personalMessage = vibe.personalMessage || '';
  const senderName = vibe.senderName || vibe.sender.split('@')[0];
  
  // Format the date
  const date = vibe.createdAt ? new Date(vibe.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : 'Just now';

  // Create a Slack message with blocks for better formatting
  return {
    text: `${senderName} sent you a vibe card! "${message}"`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🎉 You received a new vibe card!",
          emoji: true
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*From:* ${senderName}`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${message}*`
        }
      },
      personalMessage ? {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `"${personalMessage}"`
        }
      } : null,
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `*Category:* ${category} | *Date:* ${date}`
          }
        ]
      },
      {
        type: "divider"
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "View all your vibes on the 24Vibes platform:"
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Open 24Vibes",
            emoji: true
          },
          url: process.env.SITE_URL || "https://24vibes.netlify.app",
          action_id: "button-action"
        }
      }
    ].filter(Boolean) // Remove null blocks
  };
}

/**
 * Netlify function handler
 */
exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  try {
    // Check if Firebase is configured
    if (!db) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Firebase is not configured properly' })
      };
    }
    
    // Check if Slack token is configured
    if (!SLACK_TOKEN) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Slack token is not configured' })
      };
    }
    
    // Parse the request body
    const payload = JSON.parse(event.body);
    
    // Validate the payload
    if (!payload.vibeId || !payload.recipientEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: vibeId and recipientEmail' })
      };
    }

    // Get the vibe from Firestore
    const vibeRef = doc(db, 'vibes', payload.vibeId);
    const vibeDoc = await getDoc(vibeRef);
    
    if (!vibeDoc.exists()) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Vibe not found' })
      };
    }
    
    const vibe = vibeDoc.data();
    
    // Find the Slack user by email
    const slackUserId = await findSlackUserByEmail(payload.recipientEmail);
    
    if (!slackUserId) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Slack user not found' })
      };
    }
    
    // Format and send the message
    const message = formatVibeMessage(vibe);
    const success = await sendSlackMessage(slackUserId, message);
    
    if (success) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Notification sent successfully' })
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Failed to send notification' })
      };
    }
  } catch (error) {
    console.error('Error processing notification:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
    };
  }
};