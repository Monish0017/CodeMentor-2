import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';

// Configure Google Sign In
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: Constants.expoConfig?.extra?.GOOGLE_WEB_CLIENT_ID, // client ID from developer console
    iosClientId: Constants.expoConfig?.extra?.GOOGLE_IOS_CLIENT_ID, // iOS client ID
    offlineAccess: true, // for getting refresh token
    profileImageSize: 120,
  });
};

// Handle Google Sign In
export const googleSignIn = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    
    // Format the user data similar to the web version
    return {
      success: true,
      userData: {
        email: userInfo.user.email,
        name: userInfo.user.name,
        picture: userInfo.user.photo,
        sub: userInfo.user.id, // this corresponds to googleId in your backend
      }
    };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return { success: false, error: 'User cancelled the login process' };
    } else if (error.code === statusCodes.IN_PROGRESS) {
      return { success: false, error: 'Sign in is in progress already' };
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return { success: false, error: 'Play services not available or outdated' };
    } else {
      return { success: false, error: 'Unknown error occurred during Google sign in' };
    }
  }
};

// Sign out from Google
export const googleSignOut = async () => {
  try {
    await GoogleSignin.signOut();
    return { success: true };
  } catch (error) {
    console.error('Google Sign-Out Error:', error);
    return { success: false, error: 'Error signing out from Google' };
  }
};
