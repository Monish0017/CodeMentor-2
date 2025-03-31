/**
 * Google OAuth debugging utility
 */
const debug = (req, res, next) => {
  console.log('--- GOOGLE AUTH DEBUG ---');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Query:', req.query);
  console.log('Params:', req.params);
  console.log('URL:', req.url);
  console.log('Method:', req.method);
  console.log('-------------------------');
  next();
};

module.exports = debug;
