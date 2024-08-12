import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Search, Mic, MicOff, Archive, Inbox, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import '../dashboard.css';

const categories = [
  'Work', 'Personal', 'Spam', 'Social', 'Promotions', 
  'Updates', 'Finance', 'Support', 'Travel', 'Education'
];

const EmailItem = React.memo(({ email, onAction, onClick, onJunk, actionIcon, actionText, isClicked }) => {
  const formattedDate = new Date(email.date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div 
      className={`email-item ${email.isPriority ? 'priority' : ''} ${email.archived ? 'archived' : ''} ${isClicked ? 'clicked' : ''}`}
    >
      <div onClick={() => onClick(email)}>
        <h3>{email.subject || 'No subject'}</h3>
        <p>{email.summary || 'No summary available'}</p>
        <span className="email-category">{email.category}</span>
        <span className="email-date">{formattedDate}</span>
      </div>
      <div className="email-actions">
        <button onClick={(e) => { e.stopPropagation(); onAction(email.id); }} className="action-btn" title={actionText}>
          {actionIcon}
        </button>
        <button onClick={(e) => { e.stopPropagation(); onJunk(email.id); }} className="action-btn junk-btn" title="Mark as Junk">
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
});

function Dashboard() {
  const navigate = useNavigate();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [view, setView] = useState(() => localStorage.getItem('currentView') || 'inbox');
  const [clickedEmails, setClickedEmails] = useState(() => {
    const saved = localStorage.getItem('clickedEmails');
    return saved ? JSON.parse(saved) : {};
  });
  const [junkEmails, setJunkEmails] = useState(() => {
    const saved = localStorage.getItem('junkEmails');
    return saved ? JSON.parse(saved) : {};
  });

  const fetchEmails = useCallback(async () => {
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
  }, [view]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  useEffect(() => {
    localStorage.setItem('currentView', view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem('clickedEmails', JSON.stringify(clickedEmails));
  }, [clickedEmails]);

  useEffect(() => {
    localStorage.setItem('junkEmails', JSON.stringify(junkEmails));
  }, [junkEmails]);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:4000/api/logout', {}, { withCredentials: true });
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleEmailClick = useCallback((email) => {
    setClickedEmails(prev => ({ ...prev, [email.id]: true }));
    handleJunk(email.id);
    const gmailUrl = `https://mail.google.com/mail/u/0/#inbox/${email.id}`;
    window.open(gmailUrl, '_blank');
  }, []);

  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value);
  }, []);

  const handleSearch = useCallback((event) => {
    event.preventDefault();
    if (searchTerm.trim()) {
      setView('searchResults');
    }
  }, [searchTerm]);

  const toggleVoiceSearch = useCallback(() => {
    // ... (keep existing voice search logic)
  }, [isListening]);

  const handleArchive = useCallback(async (emailId) => {
    try {
      setEmails(prevEmails => prevEmails.map(email => 
        email.id === emailId ? { ...email, archived: true } : email
      ));
      await axios.post(`http://localhost:4000/api/archive/${emailId}`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Error archiving email:', error);
      setEmails(prevEmails => prevEmails.map(email => 
        email.id === emailId ? { ...email, archived: false } : email
      ));
    }
  }, []);

  const handleUnarchive = useCallback(async (emailId) => {
    try {
      setEmails(prevEmails => prevEmails.map(email => 
        email.id === emailId ? { ...email, archived: false } : email
      ));
      await axios.post(`http://localhost:4000/api/unarchive/${emailId}`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Error unarchiving email:', error);
      setEmails(prevEmails => prevEmails.map(email => 
        email.id === emailId ? { ...email, archived: true } : email
      ));
    }
  }, []);

  const handleJunk = useCallback((emailId) => {
    const now = new Date();
    const deleteDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days from now
    setJunkEmails(prev => ({ ...prev, [emailId]: deleteDate.toISOString() }));
    setEmails(prevEmails => prevEmails.filter(email => email.id !== emailId));
  }, []);

  const handleJunkAll = useCallback(() => {
    const now = new Date();
    const deleteDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days from now
    const newJunkEmails = {};
    emails.forEach(email => {
      newJunkEmails[email.id] = deleteDate.toISOString();
    });
    setJunkEmails(prev => ({ ...prev, ...newJunkEmails }));
    setEmails([]);
  }, [emails]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const updatedJunkEmails = { ...junkEmails };
      let changed = false;
      Object.entries(updatedJunkEmails).forEach(([id, dateString]) => {
        if (new Date(dateString) <= now) {
          delete updatedJunkEmails[id];
          changed = true;
        }
      });
      if (changed) {
        setJunkEmails(updatedJunkEmails);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [junkEmails]);

  const filteredEmails = useMemo(() => emails.filter(email =>
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.summary.toLowerCase().includes(searchTerm.toLowerCase())
  ), [emails, searchTerm]);

  const priorityEmails = useMemo(() => emails.filter(email => email.isPriority && !email.archived), [emails]);
  const regularEmails = useMemo(() => emails.filter(email => !email.isPriority && !email.archived), [emails]);
  const archivedEmails = useMemo(() => emails.filter(email => email.archived), [emails]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

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
          <form onSubmit={handleSearch} className="search-container">
            <input
              type="text"
              placeholder="Search all emails..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            <button type="submit" className="search-button">
              <Search size={20} />
            </button>
            <button type="button" onClick={toggleVoiceSearch} className="voice-search-btn">
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          </form>

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
            <button onClick={handleJunkAll} className="junk-all-btn">
              Junk All
            </button>
          </div>

          {view === 'searchResults' && (
            <div className="search-results">
              <h2>Search Results</h2>
              {filteredEmails.map(email => (
                <EmailItem 
                  key={email.id} 
                  email={email} 
                  onAction={email.archived ? handleUnarchive : handleArchive} 
                  onClick={handleEmailClick}
                  onJunk={handleJunk}
                  actionIcon={email.archived ? <Inbox size={20} /> : <Archive size={20} />}
                  actionText={email.archived ? "Unarchive" : "Archive"}
                  isClicked={clickedEmails[email.id]}
                />
              ))}
            </div>
          )}

          {view !== 'searchResults' && (
            <>
              {(view === 'inbox' || view === 'allPriority') && (
                <div className="email-section">
                  <h2>Priority Emails</h2>
                  {priorityEmails.slice(0, view === 'allPriority' ? undefined : 3).map(email => (
                    <EmailItem 
                      key={email.id} 
                      email={email} 
                      onAction={handleArchive} 
                      onClick={handleEmailClick}
                      onJunk={handleJunk}
                      actionIcon={<Archive size={20} />}
                      actionText="Archive"
                      isClicked={clickedEmails[email.id]}
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
                <div className="email-section">
                  <h2>Recent Emails</h2>
                  {regularEmails.slice(0, view === 'allRecent' ? undefined : 5).map(email => (
                    <EmailItem 
                      key={email.id} 
                      email={email} 
                      onAction={handleArchive} 
                      onClick={handleEmailClick}
                      onJunk={handleJunk}
                      actionIcon={<Archive size={20} />}
                      actionText="Archive"
                      isClicked={clickedEmails[email.id]}
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
                      onJunk={handleJunk}
                      actionIcon={<Inbox size={20} />}
                      actionText="Unarchive"
                      isClicked={clickedEmails[email.id]}
                    />
                  ))}
                </div>
              )}

              {(view === 'allPriority' || view === 'allRecent') && (
                <button onClick={() => setView('inbox')} className="show-less-btn">
                  Back to Inbox <ChevronUp size={20} />
                </button>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;