import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Archive, Trash2 } from 'lucide-react';
import './categoryPage.css';

function CategoryPage() {
  const { category } = useParams();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openedEmails, setOpenedEmails] = useState({});

  useEffect(() => {
    fetchEmails();
    // Load opened emails from localStorage
    const storedOpenedEmails = JSON.parse(localStorage.getItem('openedEmails') || '{}');
    setOpenedEmails(storedOpenedEmails);
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

    // Mark email as opened
    const updatedOpenedEmails = { ...openedEmails, [email.id]: true };
    setOpenedEmails(updatedOpenedEmails);
    localStorage.setItem('openedEmails', JSON.stringify(updatedOpenedEmails));
  };

  const handleArchive = async (emailId) => {
    try {
      setEmails(prevEmails => prevEmails.filter(email => email.id !== emailId));
      await axios.post(`http://localhost:4000/api/archive/${emailId}`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Error archiving email:', error);
      fetchEmails();
    }
  };

  const handleMoveToJunk = async (emailId) => {
    try {
      setEmails(prevEmails => prevEmails.filter(email => email.id !== emailId));
      await axios.post(`http://localhost:4000/api/move-to-junk/${emailId}`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Error moving email to junk:', error);
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
                onArchive={handleArchive}
                onMoveToJunk={handleMoveToJunk}
                onClick={handleEmailClick}
                isOpened={openedEmails[email.id]}
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

function EmailItem({ email, onArchive, onMoveToJunk, onClick, isOpened }) {
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
    <div className={`email-item ${email.isPriority ? 'priority' : ''} ${isOpened ? 'opened' : ''}`}>
      <div onClick={() => onClick(email)}>
        <h3>{email.summary || 'No summary available'}</h3>
        <div className="email-details">
          <span className="email-category">{email.category}</span>
          <span className="email-date">{formatDate(email.receivedAt)}</span>
          {email.isPriority && <span className="priority-tag">Priority</span>}
        </div>
      </div>
      <div className="email-actions">
        <button onClick={() => onArchive(email.id)} className="action-btn" title="Archive">
          <Archive size={20} />
        </button>
        <button onClick={() => onMoveToJunk(email.id)} className="action-btn" title="Move to Junk">
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
}

export default CategoryPage;