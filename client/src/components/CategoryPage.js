import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './categoryPage.css';

function CategoryPage() {
  const { category } = useParams();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

    fetchEmails();
  }, [category]);

  const handleEmailClick = (email) => {
    const gmailUrl = `https://mail.google.com/mail/u/0/#inbox/${email.id}`;
    window.open(gmailUrl, '_blank');
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
              <div key={email.id} className={`email-item ${email.isPriority ? 'priority' : ''}`} onClick={() => handleEmailClick(email)}>
                <h3>{email.snippet || 'No subject'}</h3>
                <span className="email-category">{email.category}</span>
              </div>
            ))
          ) : (
            <p>No emails found in this category.</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default CategoryPage;