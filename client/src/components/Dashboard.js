import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import '../dashboard.css';

const GET_USER_DATA = gql`
  query Me {
    me {
      id
      name
      email
    }
  }
`;

function Dashboard() {
  const navigate = useNavigate();
  const { loading, error, data } = useQuery(GET_USER_DATA);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) return <p>Loading...</p>;
  if (error) {
    console.error('Error fetching user data:', error);
    return <p>Error: Unable to fetch user data</p>;
  }

  if (!data || !data.me) {
    console.log('No user data found');
    return <p>No user data available</p>;
  }

  return (
    <div className="dashboard">
      <h1>Welcome, {data.me.name}!</h1>
      <p>Email: {data.me.email}</p>
      {/* Add more dashboard content here */}
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Dashboard;