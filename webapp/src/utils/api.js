export const SERVERURL = 'https://codementor-b244.onrender.com';

export const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

export const handleApiError = (error) => {
  console.error('API Error:', error);
  const message = error.response?.data?.message || 'Something went wrong. Please try again.';
  return message;
};
