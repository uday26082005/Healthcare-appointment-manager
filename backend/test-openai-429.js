const axios = require('axios');
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const prompt = 'Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: headache';

(async () => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': 'Bearer ' + OPENAI_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('SUCCESS');
  } catch (error) {
    if (error.response && error.response.data) {
      console.log('OPENAI_ERROR_DATA:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('AXIOS_ERROR:', error.message);
    }
  }
})();
