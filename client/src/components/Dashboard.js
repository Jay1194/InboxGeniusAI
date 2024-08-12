import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Search, Mic, MicOff, Archive, Inbox, ChevronDown, ChevronUp } from 'lucide-react';
import '../dashboard.css';

const categories = [
  'Work', 'Personal', 'Spam', 'Social', 'Promotions', 
  'Updates', 'Finance', 'Support', 'Travel', 'Education'
];

function Dashboard() {
  const navigate = useNavigate();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [view, setView] = useState('inbox');
  const recentEmailsRef = useRef(null);

  useEffect(() => {
    fetchEmails();
  }, [view]);

  useEffect(() => {
    if (view === 'allRecent' && recentEmailsRef.current) {
      recentEmailsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [view]);

  const fetchEmails = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/api/gmails?archived=${view === 'archived'}`, {
        withCredentials: true
      });
      setEmails(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching emails:', error);
      setError(error.response?.data || error.message);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:4000/api/logout', {}, { withCredentials: true });
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleEmailClick = (email) => {
    const gmailUrl = `https://mail.google.com/mail/u/0/#inbox/${email.id}`;
    window.open(gmailUrl, '_blank');
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const toggleVoiceSearch = () => {
    if (!isListening) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.start();
        setIsListening(true);

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setSearchTerm(transcript);
          setIsListening(false);
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };
      } else {
        alert('Speech recognition is not supported in your browser.');
      }
    } else {
      setIsListening(false);
    }
  };

  const handleArchive = async (emailId) => {
    try {
      // Optimistic update
      setEmails(prevEmails => prevEmails.map(email => 
        email.id === emailId ? { ...email, archived: true } : email
      ));
      await axios.post(`http://localhost:4000/api/archive/${emailId}`, {}, { withCredentials: true });
      // If the API call is successful, we don't need to do anything else
      // If it fails, we should revert the optimistic update
    } catch (error) {
      console.error('Error archiving email:', error);
      // Revert the optimistic update
      setEmails(prevEmails => prevEmails.map(email => 
        email.id === emailId ? { ...email, archived: false } : email
      ));
    }
  };

  const handleUnarchive = async (emailId) => {
    try {
      // Optimistic update
      setEmails(prevEmails => prevEmails.map(email => 
        email.id === emailId ? { ...email, archived: false } : email
      ));
      await axios.post(`http://localhost:4000/api/unarchive/${emailId}`, {}, { withCredentials: true });
      // If the API call is successful, we don't need to do anything else
      // If it fails, we should revert the optimistic update
    } catch (error) {
      console.error('Error unarchiving email:', error);
      // Revert the optimistic update
      setEmails(prevEmails => prevEmails.map(email => 
        email.id === emailId ? { ...email, archived: true } : email
      ));
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const priorityEmails = filteredEmails.filter(email => email.isPriority && !email.archived);
  const regularEmails = filteredEmails.filter(email => !email.isPriority && !email.archived);
  const archivedEmails = filteredEmails.filter(email => email.archived);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="logo-container">
          <div className="logo"></div>
        </div>
        <div className="user-info">
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
          <div className="search-container">
            <input
              type="text"
              placeholder="Search all emails..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            <Search className="search-icon" size={20} />
            <button onClick={toggleVoiceSearch} className="voice-search-btn">
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          </div>

          <div className="view-toggles">
            <button onClick={() => setView('inbox')} className={view === 'inbox' ? 'active' : ''}>
              Inbox
            </button>
            <button onClick={() => setView('archived')} className={view === 'archived' ? 'active' : ''}>
              Archived
            </button>
            <button onClick={() => setView('allPriority')} className={view === 'allPriority' ? 'active' : ''}>
              All Priority
            </button>
            <button onClick={() => setView('allRecent')} className={view === 'allRecent' ? 'active' : ''}>
              All Recent
            </button>
          </div>

          {(view === 'inbox' || view === 'allPriority') && (
            <div className="email-section">
              <h2>Priority Emails</h2>
              {priorityEmails.slice(0, view === 'allPriority' ? undefined : 3).map(email => (
                <EmailItem 
                  key={email.id} 
                  email={email} 
                  onAction={handleArchive} 
                  onClick={handleEmailClick}
                  actionIcon={<Archive size={20} />}
                  actionText="Archive"
                />
              ))}
              {view === 'inbox' && priorityEmails.length > 3 && (
                <button onClick={() => setView('allPriority')} className="show-more-btn">
                  Show All Priority Emails <ChevronDown size={20} />
                </button>
              )}
            </div>
          )}

          {(view === 'inbox' || view === 'allRecent') && (
            <div className="email-section" ref={recentEmailsRef}>
              <h2>Recent Emails</h2>
              {regularEmails.slice(0, view === 'allRecent' ? undefined : 5).map(email => (
                <EmailItem 
                  key={email.id} 
                  email={email} 
                  onAction={handleArchive} 
                  onClick={handleEmailClick}
                  actionIcon={<Archive size={20} />}
                  actionText="Archive"
                />
              ))}
              {view === 'inbox' && regularEmails.length > 5 && (
                <button onClick={() => setView('allRecent')} className="show-more-btn">
                  Show All Recent Emails <ChevronDown size={20} />
                </button>
              )}
            </div>
          )}

          {view === 'archived' && (
            <div className="email-section">
              <h2>Archived Emails</h2>
              {archivedEmails.map(email => (
                <EmailItem 
                  key={email.id} 
                  email={email} 
                  onAction={handleUnarchive} 
                  onClick={handleEmailClick}
                  actionIcon={<Inbox size={20} />}
                  actionText="Unarchive"
                />
              ))}
            </div>
          )}

          {(view === 'allPriority' || view === 'allRecent') && (
            <button onClick={() => setView('inbox')} className="show-less-btn">
              Back to Inbox <ChevronUp size={20} />
            </button>
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
        <h3>{email.subject || 'No subject'}</h3>
        <p>{email.summary || 'No summary available'}</p>
        <div className="email-details">
          <span className="email-category">{email.category}</span>
          <span className="email-date">{formatDate(email.receivedAt)}</span>
        </div>
      </div>
      <button onClick={() => onAction(email.id)} className="action-btn" title={actionText}>
        {actionIcon}
      </button>
    </div>
  );
}

export default Dashboard;