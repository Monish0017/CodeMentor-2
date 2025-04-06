module.exports = {
  name: "CodeMentor",
  slug: "codementor",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#6200EE"
  },
  updates: {
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.yourcompany.codementor"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#6200EE"
    },
    package: "com.yourcompany.codementor"
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  extra: {
    API_URL: process.env.API_URL || "http://192.168.175.234:5000",
    // Add default client IDs for easy development (replace with real ones in production)
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com",
    GOOGLE_ANDROID_CLIENT_ID: process.env.GOOGLE_ANDROID_CLIENT_ID || "123456789012-abcdefghijklmnopqrstuvwxyzandroid.apps.googleusercontent.com",
    GOOGLE_IOS_CLIENT_ID: process.env.GOOGLE_IOS_CLIENT_ID || "123456789012-abcdefghijklmnopqrstuvwxyzios.apps.googleusercontent.com",
    useGoogleAuth: false // Set to true when you have real client IDs
  },
  scheme: "codementor"
};
