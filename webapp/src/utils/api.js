export const SERVERURL = 'http://localhost:5000';

export const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

export const handleApiError = (error) => {
  console.error('API Error:', error);
  const message = error.response?.data?.message || 'Something went wrong. Please try again.';
  return message;
};
