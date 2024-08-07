import React from 'react';
import DOMPurify from 'dompurify';
import './emailModal.css';

function EmailModal({ email, onClose }) {
  const sanitizedContent = DOMPurify.sanitize(email.cleanedBody);

  return (
    <div className="email-modal">
      <div className="email-modal-content">
        <div className="email-modal-header">
          <h2>{email.snippet}</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="email-modal-body">
          <div className="email-summary">
            <h3>Summary:</h3>
            <p>{email.summary}</p>
          </div>
          <div className="email-full-content">
            <h3>Full Email:</h3>
            <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailModal;