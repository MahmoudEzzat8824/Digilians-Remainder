import React, { useState } from 'react';
import { Mail, Copy, Check, X } from 'lucide-react';

export default function EmailPreviewModal({ emailData, onClose }) {
  const [to, setTo] = useState(emailData.to || '');
  const [subject, setSubject] = useState(emailData.subject || '');
  const [body, setBody] = useState(emailData.body || '');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleOpenClient = () => {
    // Keep raw recipient email to prevent mailto: parser errors on some OS
    const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const link = document.createElement('a');
    link.href = mailtoUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenGmail = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail size={20} style={{ color: 'var(--accent-color)' }} />
            Email Reminder Preview
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="label-text" htmlFor="email-to">To (Instructor Email)</label>
            <input
              id="email-to"
              type="email"
              className="input-control"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="instructor@example.com"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="label-text" htmlFor="email-subject">Subject</label>
            <input
              id="email-subject"
              type="text"
              className="input-control"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="label-text" htmlFor="email-body">Email Message</label>
            <textarea
              id="email-body"
              className="input-control"
              rows={12}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', resize: 'vertical' }}
            />
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          
          <button type="button" className="btn btn-secondary" onClick={handleCopy}>
            {copied ? <Check size={16} style={{ color: 'var(--success-color)' }} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Body'}
          </button>

          <button type="button" className="btn btn-secondary" onClick={handleOpenGmail}>
            <Mail size={16} style={{ color: '#ea4335' }} />
            Open in Gmail
          </button>

          <button type="button" className="btn btn-primary" onClick={handleOpenClient}>
            <Mail size={16} />
            Open Mail Client
          </button>
        </div>
      </div>
    </div>
  );
}
