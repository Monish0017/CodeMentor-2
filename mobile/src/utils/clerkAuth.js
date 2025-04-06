import { useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useState, useEffect } from 'react';

// Hook for handling Google OAuth sign-in
export const useGoogleAuth = () => {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const { user: clerkUser } = useUser();
  const { signOut } = useAuth();
  const [pendingAction, setPendingAction] = useState(false);

  // Clear any pending actions when component unmounts
  useEffect(() => {
    return () => {
      setPendingAction(false);
    };
  }, []);

  const googleSignIn = async () => {
    try {
      // If there's already a user session, sign out first
      if (clerkUser) {
        await signOut();
      }

      if (pendingAction) {
        return { 
          success: false, 
          error: "Authentication already in progress" 
        };
      }

      setPendingAction(true);
      
      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow();
      
      // Reset pending action state
      setPendingAction(false);
      
      // Successfully authenticated with Clerk
      if (createdSessionId) {
        if (setActive) {
          await setActive({ session: createdSessionId });
        }
        
        // Extract user information from Clerk's session
        return {
          success: true,
          userData: {
            email: clerkUser?.primaryEmailAddress?.emailAddress || signIn?.identifier || "",
            name: clerkUser?.fullName || `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim() || "User",
            sub: clerkUser?.id || createdSessionId,
            picture: clerkUser?.imageUrl || null,
          }
        };
      } 
      
      // User needs to sign up
      if (signUp) {
        return {
          success: false,
          needsSignUp: true,
          error: "User registration required"
        };
      }
      
      // Other authentication flow outcomes
      if (signIn) {
        return {
          success: false,
          needsSignIn: true,
          error: "Additional authentication required"
        };
      }
      
      // Authentication was cancelled or failed
      return {
        success: false,
        error: "Authentication failed or was cancelled"
      };
    } catch (error) {
      console.error("Google OAuth error:", error);
      setPendingAction(false);
      
      if (error.message?.includes('single session mode')) {
        return {
          success: false,
          error: "You're already logged in to a Clerk session. Please sign out first."
        };
      }
      
      return {
        success: false,
        error: error.message || "Failed to authenticate with Google"
      };
    }
  };

  return { googleSignIn };
};

// Helper function to get OAuth result information
export const getOAuthUserInfo = async () => {
  const { user } = useUser();
  
  if (!user) return null;
  
  // Extract relevant user information
  return {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress,
    name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    picture: user.imageUrl,
    sub: user.id, // Use as googleId
  };
};
