import React from 'react';
import DOMPurify from 'dompurify';
import './emailModal.css';

function EmailModal({ email, onClose }) {
  const sanitizeConfig = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'table', 'tr', 'td', 'th', 'div', 'span'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'style', 'target', 'class', 'id'],
    ALLOW_DATA_ATTR: true
  };

  const sanitizedContent = DOMPurify.sanitize(email.body || '', sanitizeConfig);

  return (
    <div className="email-modal">
      <div className="email-modal-content">
        <div className="email-modal-header">
          <h2>{email.snippet || 'No subject'}</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="email-modal-body">
          <div className="email-metadata">
            {email.from && <p><strong>From:</strong> {email.from}</p>}
            {email.to && <p><strong>To:</strong> {email.to}</p>}
            {email.date && <p><strong>Date:</strong> {new Date(email.date).toLocaleString()}</p>}
          </div>
          <div className="email-full-content" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
        </div>
      </div>
    </div>
  );
}

export default EmailModal;