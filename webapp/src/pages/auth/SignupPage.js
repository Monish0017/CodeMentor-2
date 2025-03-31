import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './SignupPage.css';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const RegisterPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Check if we have Google credentials from login redirect
  useEffect(() => {
    const handleGoogleRedirect = async () => {
      const googleCredential = location.state?.googleCredential;
      
      if (googleCredential) {
        try {
          setLoading(true);
          const userInfo = jwtDecode(googleCredential);
          
          // Pre-fill form with Google data
          setFormData(prev => ({
            ...prev,
            name: userInfo.name || '',
            email: userInfo.email || ''
          }));
          
          // Set profile image preview if available
          if (userInfo.picture) {
            setPreviewUrl(userInfo.picture);
          }
          
          // Automatically register with Google
          await handleGoogleSignup(googleCredential, userInfo);
        } catch (error) {
          console.error('Error processing Google redirect:', error);
          setError('Failed to process Google sign-in data');
          setLoading(false);
        }
      }
    };
    
    handleGoogleRedirect();
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // Create form data for file upload
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('password', formData.password);
      submitData.append('authType', 'local');
      
      // Add profile image if selected
      if (profileImage) {
        submitData.append('profilePicture', profileImage);
      }
      
      const response = await axios.post(`${apiUrl}/api/auth/register`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Registration successful:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      } else {
        navigate('/auth/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async (credential, decodedInfo = null) => {
    try {
      if (!decodedInfo) {
        decodedInfo = jwtDecode(credential);
      }
      
      console.log('Google user info:', decodedInfo);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/api/auth/register`, {
        name: decodedInfo.name,
        email: decodedInfo.email,
        googleId: decodedInfo.sub,
        profilePicture: decodedInfo.picture,
        authType: 'google'
      });
      
      console.log('Google registration successful:', response.data);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Google signup error:', error);
      setError(error.response?.data?.message || 'Failed to create account with Google');
      setLoading(false);
    }
  };

  const handleGoogleSignupSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      await handleGoogleSignup(credentialResponse.credential);
    } catch (error) {
      // Error is already handled in handleGoogleSignup
    }
  };

  const handleGoogleSignupError = () => {
    setError('Google sign-up was unsuccessful. Please try again.');
  };

  return (
    <div className="signup-container">
      <h2>Register</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        {/* Profile Picture Upload */}
        <div className="form-group profile-upload-container">
          <label htmlFor="profilePicture">Profile Picture</label>
          <div className="profile-image-preview">
            {previewUrl ? (
              <div className="image-preview-container">
                <img src={previewUrl} alt="Profile Preview" className="profile-preview" />
                <button 
                  type="button" 
                  className="remove-image-btn"
                  onClick={handleRemoveImage}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="upload-placeholder" onClick={() => fileInputRef.current?.click()}>
                <span className="upload-icon">📷</span>
                <span>Upload Photo</span>
              </div>
            )}
          </div>
          <input
            type="file"
            id="profilePicture"
            name="profilePicture"
            ref={fileInputRef}
            onChange={handleProfileImageChange}
            accept="image/*"
            className="file-input"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="8"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        
        <button type="submit" className="signup-button" disabled={loading}>
          {loading ? 'Creating Account...' : 'Register Account'}
        </button>
      </form>
      
      <div className="divider">OR</div>
      
      <div className="google-signup-container">
        <GoogleLogin
          onSuccess={handleGoogleSignupSuccess}
          onError={handleGoogleSignupError}
          useOneTap
        />
      </div>
      
      <div className="login-link">
        Already have an account? <Link to="/auth/login">Log In</Link>
      </div>
    </div>
  );
};

export default RegisterPage;
