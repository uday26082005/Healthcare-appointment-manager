const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const generatePreVisitSummary = async (symptoms) => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key') {
    throw new Error('OpenAI API key missing or invalid');
  }

  const prompt = `Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: ${symptoms}
  
Provide the output strictly in JSON format with the following keys:
- "urgency_level" (must be exactly "Low", "Medium", or "High")
- "chief_complaint" (string)
- "suggested_questions" (array of exactly 3 strings)`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo', // or gpt-4 depending on their key, keeping it 3.5 for cost/speed
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    const content = response.data.choices[0].message.content;
    const parsed = JSON.parse(content);

    // Validate the output
    if (!['Low', 'Medium', 'High'].includes(parsed.urgency_level)) {
      throw new Error('Invalid urgency level returned from AI');
    }
    if (!parsed.chief_complaint || typeof parsed.chief_complaint !== 'string') {
      throw new Error('Invalid chief complaint returned from AI');
    }
    if (!Array.isArray(parsed.suggested_questions) || parsed.suggested_questions.length !== 3) {
      throw new Error('Invalid suggested questions returned from AI');
    }

    return parsed;
  } catch (error) {
    console.error('LLM Pre-Visit Summary Error:', error.message);
    throw error; // Let the caller handle the graceful fallback
  }
};

const generatePostVisitSummary = async (notes) => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key') {
    throw new Error('OpenAI API key missing or invalid');
  }

  const prompt = `Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: ${notes}`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('LLM Post-Visit Summary Error:', error.message);
    throw error;
  }
};

module.exports = { generatePreVisitSummary, generatePostVisitSummary };
