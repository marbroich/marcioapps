// Chat Widget for YOUR_PROPERTY_NAME
// Uses Edge Function proxy to call Gemini API (keeps API key secure)

const SUPABASE_URL = 'https://xlhepbwnvdmhnwqndksj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsaGVwYndudmRtaG53cW5ka3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1Nzc5MTQsImV4cCI6MjA5MzE1MzkxNH0.g3yfrL6nVsxssASjsBirNYfDTZBiiR0M0a9lYj9afzA';
const ASK_QUESTION_URL = `${SUPABASE_URL}/functions/v1/ask-question`;

/**
 * Initialize the chat widget (no longer needs API key - uses Edge Function)
 */
export async function initChatWidget() {
  // Nothing to initialize - Edge Function handles everything
  return true;
}

/**
 * Ask a question and get an AI-generated answer
 * @param {string} question - The user's question
 * @returns {Promise<{answer: string, confident: boolean}>}
 */
export async function askQuestion(question) {
  if (!question.trim()) {
    throw new Error('Please enter a question.');
  }

  try {
    const response = await fetch(ASK_QUESTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ question })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get a response. Please try again.');
    }

    return {
      answer: data.answer,
      confident: data.confident
    };
  } catch (error) {
    console.error('Error asking question:', error);
    throw error;
  }
}

/**
 * Submit a question that couldn't be answered for admin review
 * @param {string} question - The original question
 * @param {string} userEmail - Optional user email for follow-up
 * @param {string} source - Source of the submission ('user_feedback' or 'low_confidence')
 * @param {string} userName - Optional user name
 * @param {string} userPhone - Optional user phone
 */
export async function submitUnansweredQuestion(question, userEmail = null, source = 'user_feedback', userName = null, userPhone = null) {
  try {
    const body = {
      question,
      user_email: userEmail,
      source,
      answer: null,
      is_published: false
    };
    if (userName) body.user_name = userName;
    if (userPhone) body.user_phone = userPhone;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/faq_entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error('Failed to submit question');
    }

    // Also send email notification to admin
    await sendAdminNotification(question, userEmail);

    return true;
  } catch (error) {
    console.error('Error submitting question:', error);
    throw error;
  }
}

/**
 * Send email notification to admin about unanswered question
 */
async function sendAdminNotification(question, userEmail) {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        type: 'faq_unanswered',
        to: 'admin@YOUR_DOMAIN',
        data: {
          question,
          user_email: userEmail || 'Not provided',
          faq_admin_url: 'https://YOUR_DOMAIN/spaces/admin/faq.html'
        }
      })
    });
  } catch (error) {
    console.warn('Failed to send admin notification:', error);
    // Don't throw - the question was still saved
  }
}

export default {
  initChatWidget,
  askQuestion,
  submitUnansweredQuestion
};
