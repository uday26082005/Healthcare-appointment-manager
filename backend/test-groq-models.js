const axios = require('axios');
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

(async () => {
  try {
    const response = await axios.get(
      'https://api.groq.com/openai/v1/models',
      {
        headers: {
          'Authorization': 'Bearer ' + GROQ_API_KEY
        }
      }
    );
    console.log('MODELS:', response.data.data.map(m => m.id));
  } catch (error) {
    if (error.response && error.response.data) {
      console.log('GROQ_ERROR_DATA:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('AXIOS_ERROR:', error.message);
    }
  }
})();
