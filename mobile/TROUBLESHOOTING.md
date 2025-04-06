# Troubleshooting Guide for CodeMentor Mobile

## Environment Variables

If you're seeing issues with environment variables:

1. Make sure you have a `.env` file in your project root with required variables:
   ```
   API_URL=https://codementor-b244.onrender.com
   GOOGLE_CLIENT_ID=your-google-client-id
   IOS_GOOGLE_CLIENT_ID=your-ios-google-client-id
   ANDROID_GOOGLE_CLIENT_ID=your-android-google-client-id
   ```

2. Try running with the `--clear` flag to clear cache:
   ```
   npm run start-clear
   ```

## URI Scheme Issues

If you're seeing "The project does not contain any URI schemes" warning:

1. Make sure you're using the updated start commands that include the `--scheme` flag:
   ```
   npm run start
   ```

2. For standalone apps, verify that the scheme is configured in `app.config.js`.

3. For Android, the scheme should be included in the `intentFilters` configuration.

## Connection Issues

If you can only connect via localhost:

1. Try the tunnel option:
   ```
   npm run start-tunnel
   ```

2. Make sure your firewall isn't blocking connections.

3. Verify that your mobile device and computer are on the same network when using LAN mode.

## Google Authentication Issues

1. Make sure you've properly configured the Google Developer Console:
   - Created an OAuth 2.0 Client ID
   - Added the correct redirect URIs
   - Enabled necessary APIs

2. Verify your client IDs are correctly set in the .env file.

## API Connection Issues

If you're having trouble connecting to the backend:

1. Verify your `API_URL` is correct in the `.env` file
2. Check your network connection
3. Ensure the API server is running and accessible

## Metro Bundler Issues

If the Metro bundler crashes or behaves unexpectedly:

1. Clear cache and restart:
   ```
   npm run start-clear
   ```

2. Delete the `node_modules` folder and reinstall dependencies:
   ```
   rm -rf node_modules
   npm install
   ```
