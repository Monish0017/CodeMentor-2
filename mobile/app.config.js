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
    API_URL: process.env.API_URL || "http://localhost:5000",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE"
  },
  // Remove plugins section as we're not using config plugins
  scheme: "codementor" // Important for deep linking and auth redirects
};
