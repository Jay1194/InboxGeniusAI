import React, { useState, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
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

const categories = [
  'Work', 'Personal', 'Spam', 'Social', 'Promotions', 
  'Updates', 'Finance', 'Support', 'Travel', 'Education'
];

function Dashboard() {
  const navigate = useNavigate();
  const { loading: userLoading, error: userError, data: userData } = useQuery(GET_USER_DATA);
  const [emails, setEmails] = useState([]);
  const [emailsLoading, setEmailsLoading] = useState(true);
  const [emailsError, setEmailsError] = useState(null);

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/gmails', {
          withCredentials: true
        });
        setEmails(response.data);
        setEmailsLoading(false);
      } catch (error) {
        console.error('Error fetching emails:', error);
        setEmailsError(error.response?.data || error.message);
        setEmailsLoading(false);
      }
    };

    fetchEmails();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:4000/api/logout', {}, { withCredentials: true });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleEmailClick = (email) => {
    const gmailUrl = `https://mail.google.com/mail/u/0/#inbox/${email.id}`;
    window.open(gmailUrl, '_blank');
  };

  if (userLoading || emailsLoading) return <div className="loading">Loading...</div>;
  if (userError) return <div className="error">Error: Unable to fetch user data</div>;
  if (emailsError) return <div className="error">Error fetching emails: {emailsError}</div>;
  if (!userData || !userData.me) return <div className="error">No user data available</div>;

  const priorityEmails = emails.filter(email => email.isPriority);
  const regularEmails = emails.filter(email => !email.isPriority);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="logo-container">
          <div className="logo"></div>
        </div>
        <div className="user-info">
          <span>{userData.me.name}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>
      
      <main className="dashboard-main">
        <nav className="category-nav">
          <h2>Categories</h2>
          {categories.map(category => (
            <Link key={category} to={`/category/${category.toLowerCase()}`} className="category-link">
              {category}
            </Link>
          ))}
        </nav>

        <section className="email-list">
          <h2>Priority Emails<span> ⚠️ </span></h2>
          {priorityEmails.length > 0 ? (
            priorityEmails.slice(0, 3).map(email => (
              <div key={email.id} className="email-item priority" onClick={() => handleEmailClick(email)}>
                <h3>{email.summary || 'No summary available'}</h3>
                <span className="email-category">{email.category}</span>
              </div>
            ))
          ) : (
            <p>No priority emails</p>
          )}

          <h2>Recent Emails</h2>
          {regularEmails.slice(0, 5).map(email => (
            <div key={email.id} className="email-item" onClick={() => handleEmailClick(email)}>
              <h3>{email.summary || 'No summary available'}</h3>
              <span className="email-category">{email.category}</span>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;