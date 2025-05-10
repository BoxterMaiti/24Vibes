const fetch = require('node-fetch');

// Slack API token from environment variable
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
 * Send a message to Slack
 * @param {object} options - Message options
 * @returns {Promise<boolean>} - Success status
 */
async function sendSlackMessage(options) {
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
      body: JSON.stringify(options)
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

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  try {
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
    if (!payload.message || !payload.type || 
        (payload.type === 'channel' && !payload.channel) || 
        (payload.type === 'dm' && (!payload.emails || !Array.isArray(payload.emails)))) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid request payload' })
      };
    }

    let success = false;

    if (payload.type === 'channel') {
      // Send message to channel
      success = await sendSlackMessage({
        channel: `#${payload.channel.replace(/^#/, '')}`,
        text: payload.message
      });
    } else {
      // Send DMs to multiple users
      const results = await Promise.all(
        payload.emails.map(async (email) => {
          const userId = await findSlackUserByEmail(email);
          if (userId) {
            return sendSlackMessage({
              channel: userId,
              text: payload.message
            });
          }
          return false;
        })
      );
      
      success = results.some(result => result === true);
    }
    
    if (success) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Message sent successfully' })
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Failed to send message' })
      };
    }
  } catch (error) {
    console.error('Error processing request:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
    };
  }
};