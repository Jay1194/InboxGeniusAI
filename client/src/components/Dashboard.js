import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Search, Mic, MicOff, Archive, Inbox } from 'lucide-react';
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
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    fetchEmails();
  }, [showArchived]);

  const fetchEmails = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/api/gmails?archived=${showArchived}`, {
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
      await axios.post(`http://localhost:4000/api/archive/${emailId}`, {}, { withCredentials: true });
      fetchEmails();
    } catch (error) {
      console.error('Error archiving email:', error);
    }
  };

  const handleUnarchive = async (emailId) => {
    try {
      await axios.post(`http://localhost:4000/api/unarchive/${emailId}`, {}, { withCredentials: true });
      fetchEmails();
    } catch (error) {
      console.error('Error unarchiving email:', error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const priorityEmails = filteredEmails.filter(email => email.isPriority);
  const regularEmails = filteredEmails.filter(email => !email.isPriority);

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

          <div className="archive-toggle">
            <button onClick={() => setShowArchived(!showArchived)}>
              {showArchived ? <Inbox size={20} /> : <Archive size={20} />}
              {showArchived ? 'Show Inbox' : 'Show Archived'}
            </button>
          </div>

          {showArchived ? (
            <>
              <h2>Archived Emails</h2>
              {filteredEmails.map(email => (
                <EmailItem 
                  key={email.id} 
                  email={email} 
                  onAction={handleUnarchive} 
                  onClick={handleEmailClick}
                  actionIcon={<Inbox size={20} />}
                  actionText="Unarchive"
                />
              ))}
            </>
          ) : (
            <>
              <h2>Priority Emails</h2>
              {priorityEmails.map(email => (
                <EmailItem 
                  key={email.id} 
                  email={email} 
                  onAction={handleArchive} 
                  onClick={handleEmailClick}
                  actionIcon={<Archive size={20} />}
                  actionText="Archive"
                />
              ))}

              <h2>Recent Emails</h2>
              {regularEmails.map(email => (
                <EmailItem 
                  key={email.id} 
                  email={email} 
                  onAction={handleArchive} 
                  onClick={handleEmailClick}
                  actionIcon={<Archive size={20} />}
                  actionText="Archive"
                />
              ))}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function EmailItem({ email, onAction, onClick, actionIcon, actionText }) {
  return (
    <div className={`email-item ${email.isPriority ? 'priority' : ''}`}>
      <div onClick={() => onClick(email)}>
        <h3>{email.subject || 'No subject'}</h3>
        <p>{email.summary || 'No summary available'}</p>
        <span className="email-category">{email.category}</span>
      </div>
      <button onClick={() => onAction(email.id)} className="action-btn" title={actionText}>
        {actionIcon}
      </button>
    </div>
  );
}

export default Dashboard;