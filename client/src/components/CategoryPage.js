import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Archive } from 'lucide-react';
import './categoryPage.css';

function CategoryPage() {
  const { category } = useParams();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEmails();
  }, [category]);

  const fetchEmails = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/api/gmails?category=${category}`, {
        withCredentials: true
      });
      setEmails(response.data);
      setLoading(false);
    } catch (error) {
      console.error(`Error fetching ${category} emails:`, error);
      setError(error.response?.data || error.message);
      setLoading(false);
    }
  };

  const handleEmailClick = (email) => {
    const gmailUrl = `https://mail.google.com/mail/u/0/#inbox/${email.id}`;
    window.open(gmailUrl, '_blank');
  };

  const handleArchive = async (emailId) => {
    try {
      // Optimistic update
      setEmails(prevEmails => prevEmails.filter(email => email.id !== emailId));
      
      // Perform the actual archive operation
      await axios.post(`http://localhost:4000/api/archive/${emailId}`, {}, { withCredentials: true });
      
      // If the API call is successful, we don't need to do anything else
      // If it fails, we should revert the optimistic update (handled in the catch block)
    } catch (error) {
      console.error('Error archiving email:', error);
      // Revert the optimistic update
      fetchEmails();
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error fetching emails: {error}</div>;

  return (
    <div className="category-page">
      <header className="category-header">
        <h1>{category.charAt(0).toUpperCase() + category.slice(1)} Emails</h1>
        <Link to="/dashboard" className="back-link">Back to Dashboard</Link>
      </header>
      
      <main className="category-main">
        <section className="email-list">
          {emails.length > 0 ? (
            emails.map(email => (
              <EmailItem 
                key={email.id} 
                email={email} 
                onAction={handleArchive} 
                onClick={handleEmailClick}
                actionIcon={<Archive size={20} />}
                actionText="Archive"
              />
            ))
          ) : (
            <p>No emails found in this category.</p>
          )}
        </section>
      </main>
    </div>
  );
}

function EmailItem({ email, onAction, onClick, actionIcon, actionText }) {
  function formatDate(internalDate) {
    if (!internalDate) return 'Date unknown';
    
    const date = new Date(parseInt(internalDate, 10));
    if (isNaN(date.getTime())) return 'Date unknown';
  
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    };
  
    return date.toLocaleString('en-US', options);
  }

  return (
    <div className={`email-item ${email.isPriority ? 'priority' : ''}`}>
      <div onClick={() => onClick(email)}>
        <h3>{email.summary || 'No summary available'}</h3>
        <div className="email-details">
          <span className="email-category">{email.category}</span>
          <span className="email-date">{formatDate(email.receivedAt)}</span>
          {email.isPriority && <span className="priority-tag">Priority</span>}
        </div>
      </div>
      <button onClick={() => onAction(email.id)} className="archive-btn" title={actionText}>
        {actionIcon}
      </button>
    </div>
  );
}

export default CategoryPage;
