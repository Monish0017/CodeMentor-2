import { Stack } from "expo-router";
import { View } from "react-native";

// This file is currently causing conflicts with the main App.js
// In a hybrid app (traditional Navigation + Expo Router), we should
// be careful about configuration

export default function Layout() {
  // If you want to use Expo Router later, uncomment this
  // For now, we'll rely on the traditional navigation setup in src/navigation
  return null;
  
  /*
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
  */
}