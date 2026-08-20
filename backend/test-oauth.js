const axios = require('axios');
(async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/calendar/callback?code=TEST_CODE_XYZ123&state=2');
    console.log(res.data);
  } catch (err) {
    console.log('AXIOS ERROR:', err.message);
    if (err.response) {
      console.log('STATUS:', err.response.status);
      console.log('DATA:', err.response.data);
    }
  }
})();
