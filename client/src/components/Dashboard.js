import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Search, Mic, MicOff, Archive, Inbox, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
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
  const [openedEmails, setOpenedEmails] = useState({});
  const [lastCheckedTime, setLastCheckedTime] = useState(Date.now());

  useEffect(() => {
    fetchEmails();
    const storedOpenedEmails = JSON.parse(localStorage.getItem('openedEmails') || '{}');
    setOpenedEmails(storedOpenedEmails);

    // Set up interval to check for new priority emails
    const intervalId = setInterval(checkNewPriorityEmails, 60000); // Check every minute

    return () => clearInterval(intervalId); // Clean up on unmount
  }, [view]);

  useEffect(() => {
    if (view === 'allRecent' && recentEmailsRef.current) {
      recentEmailsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [view]);

  const fetchEmails = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/api/gmails?view=${view}`, {
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

  const checkNewPriorityEmails = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/api/gmails?view=priority&since=${lastCheckedTime}`, {
        withCredentials: true
      });
      const newPriorityEmails = response.data;

      if (newPriorityEmails.length > 0) {
        showNotification(`You have ${newPriorityEmails.length} new priority email(s)!`);
        setLastCheckedTime(Date.now());
        fetchEmails(); // Refresh the email list
      }
    } catch (error) {
      console.error('Error checking for new priority emails:', error);
    }
  };

  const showNotification = (message) => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('New Priority Email', { body: message });
        }
      });
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
    const gmailUrl = `https://mail.google.com/mail/u/0/#${view === 'junk' ? 'spam' : 'inbox'}/${email.id}`;
    window.open(gmailUrl, '_blank');

    // Mark email as opened
    const updatedOpenedEmails = { ...openedEmails, [email.id]: true };
    setOpenedEmails(updatedOpenedEmails);
    localStorage.setItem('openedEmails', JSON.stringify(updatedOpenedEmails));
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
      setEmails(prevEmails => prevEmails.filter(email => email.id !== emailId));
      await axios.post(`http://localhost:4000/api/archive/${emailId}`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Error archiving email:', error);
      fetchEmails();
    }
  };

  const handleUnarchive = async (emailId) => {
    try {
      setEmails(prevEmails => prevEmails.filter(email => email.id !== emailId));
      await axios.post(`http://localhost:4000/api/unarchive/${emailId}`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Error unarchiving email:', error);
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

  const handleMoveFromJunk = async (emailId) => {
    try {
      setEmails(prevEmails => prevEmails.filter(email => email.id !== emailId));
      await axios.post(`http://localhost:4000/api/move-from-junk/${emailId}`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Error moving email from junk:', error);
      fetchEmails();
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const priorityEmails = filteredEmails.filter(email => email.isPriority && !email.archived && !email.isJunk);
  const regularEmails = filteredEmails.filter(email => !email.isPriority && !email.archived && !email.isJunk);
  const archivedEmails = filteredEmails.filter(email => email.archived && !email.isJunk);
  const junkEmails = filteredEmails.filter(email => email.isJunk);

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
            <button 
              onClick={() => setView('inbox')} 
              className={view === 'inbox' ? 'active' : ''}
            >
              Inbox
            </button>
            <button 
              onClick={() => setView('allPriority')} 
              className={view === 'allPriority' ? 'active' : ''}
            >
              Priority
            </button>
            <button 
              onClick={() => setView('archived')} 
              className={view === 'archived' ? 'active' : ''}
            >
              Archived
            </button>
            <button 
              onClick={() => setView('junk')} 
              className={view === 'junk' ? 'active' : ''}
            >
              Junk
            </button>
          </div>

          {searchTerm && (
            <div className="email-section search-results">
              <h2>Search Results</h2>
              {filteredEmails.length === 0 ? (
                <p>No emails found.</p>
              ) : (
                filteredEmails.map(email => (
                  <EmailItem 
                    key={email.id} 
                    email={email} 
                    onArchive={handleArchive}
                    onMoveToJunk={handleMoveToJunk}
                    onMoveFromJunk={handleMoveFromJunk}
                    onClick={handleEmailClick}
                    isOpened={openedEmails[email.id]}
                    view={view}
                  />
                ))
              )}
            </div>
          )}

          {!searchTerm && (
            <>
              {(view === 'inbox' || view === 'allPriority') && (
                <div className="email-section">
                  <h2>Priority Emails</h2>
                  {priorityEmails.slice(0, view === 'allPriority' ? undefined : 3).map(email => (
                    <EmailItem 
                      key={email.id} 
                      email={email} 
                      onArchive={handleArchive}
                      onMoveToJunk={handleMoveToJunk}
                      onClick={handleEmailClick}
                      isOpened={openedEmails[email.id]}
                      view={view}
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
                      onArchive={handleArchive}
                      onMoveToJunk={handleMoveToJunk}
                      onClick={handleEmailClick}
                      isOpened={openedEmails[email.id]}
                      view={view}
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
                      onArchive={handleUnarchive}
                      onMoveToJunk={handleMoveToJunk}
                      onClick={handleEmailClick}
                      isOpened={openedEmails[email.id]}
                      view={view}
                    />
                  ))}
                </div>
              )}

              {view === 'junk' && (
                <div className="email-section">
                  <h2>Junk Emails</h2>
                  {junkEmails.map(email => (
                    <EmailItem 
                      key={email.id} 
                      email={email} 
                      onMoveFromJunk={handleMoveFromJunk}
                      onClick={handleEmailClick}
                      isOpened={openedEmails[email.id]}
                      view={view}
                    />
                  ))}
                </div>
              )}

              {(view === 'allPriority' || view === 'allRecent') && (
                <button onClick={() => setView('inbox')} className="show-less-btn">
                  <ChevronUp size={20} /> Back to Inbox
                </button>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function EmailItem({ email, onArchive, onMoveToJunk, onMoveFromJunk, onClick, isOpened, view }) {
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
        <h3>{email.subject || 'No subject'}</h3>
        <div className="email-details">
          <span className="email-category">{email.category}</span>
          <span className="email-date">{formatDate(email.receivedAt)}</span>
        </div>
      </div>
      <div className="email-actions">
        {view !== 'junk' && (
          <>
            <button onClick={() => onArchive(email.id)} className="action-btn" title="Archive">
              <Archive size={20} />
            </button>
            <button onClick={() => onMoveToJunk(email.id)} className="action-btn" title="Move to Junk">
              <Trash2 size={20} />
            </button>
          </>
        )}
        {view === 'junk' && (
          <button onClick={() => onMoveFromJunk(email.id)} className="action-btn" title="Move to Inbox">
            <Inbox size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

export default Dashboard;