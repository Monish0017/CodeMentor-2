// ...existing code...

export const loginWithGoogle = async () => {
  try {
    // This will open the Google popup
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await firebase.auth().signInWithPopup(provider);
    
    // Get the user's ID token
    const idToken = await result.user.getIdToken();
    
    // Call your backend API to validate the token and return user data
    const response = await axios.post(`${API_BASE_URL}/auth/google`, { idToken });
    
    // Store in localStorage
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return { success: true, user: response.data.user };
  } catch (error) {
    console.error('Google login error:', error);
    
    // Handle specific error codes
    if (error.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'Google sign-in was cancelled' };
    }
    
    if (error.code === 'auth/network-request-failed') {
      return { success: false, error: 'Network error. Please check your connection.' };
    }
    
    return { success: false, error: error.message || 'Google login failed' };
  }
};

// ...existing code...
