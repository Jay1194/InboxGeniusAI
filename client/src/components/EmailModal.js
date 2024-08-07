import React from 'react';
import DOMPurify from 'dompurify';

function EmailModal({ email, onClose }) {
  const sanitizedContent = DOMPurify.sanitize(email.cleanedBody);

  return (
    <div className="email-modal">
      <div className="email-modal-content">
        <h2>{email.snippet}</h2>
        <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default EmailModal;