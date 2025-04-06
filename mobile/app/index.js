import { Redirect } from 'expo-router';

export default function Index() {
  // This redirects to the main app, or you can display a loading screen here
  // Since we're primarily using src/navigation/AppNavigator.js for navigation
  return <Redirect href="../App" />;
}