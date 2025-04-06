import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const GoogleAuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/google/callback`, {
          withCredentials: true,
        });

        localStorage.setItem('token', response.data.token);
        navigate('/dashboard');
      } catch (err) {
        setError('Google authentication failed.');
        console.error('Google auth error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  return loading ? <p>Logging in...</p> : <p>{error}</p>;
};

export default GoogleAuthCallback;
