const axios = require('axios');

// Define the Judge0 URL (local Docker instance)
const judge0Url = process.env.LOCAL_JUDGE0_URL || 'http://localhost:2358';

async function checkJudge0() {
  try {
    console.log(`Checking Judge0 connection at: ${judge0Url}`);
    
    // Try to get the health status
    const response = await axios.get(`${judge0Url}/health`, {
      timeout: 3000 // 3 second timeout
    });
    
    if (response.status === 200) {
      console.log('✅ Judge0 is running and responding!');
      console.log('Health check details:', response.data);
      return true;
    } else {
      console.error(`❌ Judge0 returned unexpected status: ${response.status}`);
      console.error(response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to connect to Judge0:');
    console.error(`Error: ${error.message}`);
    console.error('Make sure:');
    console.error('1. The Judge0 Docker container is running');
    console.error('2. It\'s accessible at: ' + judge0Url);
    console.error('3. There are no network/firewall issues');
    return false;
  }
}

// Run the check
checkJudge0();
