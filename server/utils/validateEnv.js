/**
 * Validates that all required environment variables are set
 * @returns {boolean} True if all required variables are present
 */
const validateEnv = () => {
  const requiredVars = [
    'PORT',
    'NODE_ENV',
    'MONGODB_URI',
    'JWT_SECRET',
    'CLIENT_URL',
    'MOBILE_CLIENT_URL'
  ];

  // Google OAuth variables
  const googleAuthVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI'
  ];

  // Check required vars
  for (const variable of requiredVars) {
    if (!process.env[variable]) {
      console.error(`Required environment variable ${variable} is missing`);
      return false;
    }
  }

  // Check Google OAuth vars and warn if missing
  const missingGoogleVars = googleAuthVars.filter(v => !process.env[v]);
  if (missingGoogleVars.length > 0) {
    console.warn(`Warning: Missing Google OAuth variables: ${missingGoogleVars.join(', ')}`);
    console.warn('Google authentication will not work correctly without these variables');
  }

  return true;
};

module.exports = validateEnv;
