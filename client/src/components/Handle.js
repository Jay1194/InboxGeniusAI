// HandleAuth.js
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function HandleAuth() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      // Store the token in localStorage or your preferred state management solution
      localStorage.setItem('token', token);
      // Redirect to dashboard
      navigate('/dashboard');
    }
  }, [location, navigate]);

  return <div>Authenticating...</div>;
}

export default HandleAuth;