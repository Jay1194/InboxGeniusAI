import React from 'react';
import SearchBar from './SearchBar';
import ViewToggle from './ViewToggle';
import EmailItem from './EmailItem';
import { Archive, Inbox } from 'lucide-react';
import './EmailSection.css';

function EmailSection({ 
  view, setView, searchTerm, setSearchTerm, emails, 
  handleArchive, handleUnarchive, handleEmailClick, openedEmails 
}) {
  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const priorityEmails = filteredEmails.filter(email => email.isPriority && !email.archived);
  const regularEmails = filteredEmails.filter(email => !email.isPriority && !email.archived);
  const archivedEmails = filteredEmails.filter(email => email.archived);

  return (
    <section className="email-list">
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <ViewToggle view={view} setView={setView} />

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
                onAction={handleArchive} 
                onClick={handleEmailClick}
                actionIcon={<Archive size={20} />}
                actionText="Archive"
                isOpened={openedEmails[email.id]}
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
                  onAction={handleArchive} 
                  onClick={handleEmailClick}
                  actionIcon={<Archive size={20} />}
                  actionText="Archive"
                  isOpened={openedEmails[email.id]}
                />
              ))}
              {view === 'inbox' && priorityEmails.length > 3 && (
                <button onClick={() => setView('allPriority')} className="show-more-btn">
                  Show All Priority Emails
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
                  actionIcon={<Archive size={20} />}
                  actionText="Archive"
                  isOpened={openedEmails[email.id]}
                />
              ))}
              {view === 'inbox' && regularEmails.length > 5 && (
                <button onClick={() => setView('allRecent')} className="show-more-btn">
                  Show All Recent Emails
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
                  isOpened={openedEmails[email.id]}
                />
              ))}
            </div>
          )}

          {(view === 'allPriority' || view === 'allRecent') && (
            <button onClick={() => setView('inbox')} className="show-less-btn">
              Back to Inbox
            </button>
          )}
        </>
      )}
    </section>
  );
}

export default EmailSection;