import React, { useState } from 'react';
import { Mail, Copy, Check, X, MessageCircle } from 'lucide-react';

export default function EmailPreviewModal({ emailData, onClose }) {
  const [to, setTo] = useState(emailData.to || '');
  const [subject, setSubject] = useState(emailData.subject || '');
  const [body, setBody] = useState(emailData.body || '');
  const [copied, setCopied] = useState(null); // null, 'email', 'whatsapp'
  const [activeTab, setActiveTab] = useState('email'); // 'email' or 'whatsapp'

  const whatsappBody = emailData.whatsappBody || body;

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(body);
      setCopied('email');
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(whatsappBody);
      setCopied('whatsapp');
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleOpenClient = () => {
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

  const handleOpenWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(whatsappBody)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '640px', width: '92%' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {activeTab === 'email' ? (
              <Mail size={20} style={{ color: 'var(--accent-color)' }} />
            ) : (
              <MessageCircle size={20} style={{ color: '#25d366' }} />
            )}
            {activeTab === 'email' ? 'Email Reminder Preview' : 'WhatsApp Message Preview'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          gap: '0',
          marginTop: '1rem',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1px solid var(--card-border)',
          width: 'fit-content'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: activeTab === 'email' ? 'var(--accent-color)' : 'var(--input-bg)',
              color: activeTab === 'email' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            <Mail size={14} />
            Email
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: 'none',
              borderLeft: '1px solid var(--card-border)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: activeTab === 'whatsapp' ? '#25d366' : 'var(--input-bg)',
              color: activeTab === 'whatsapp' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            <MessageCircle size={14} />
            WhatsApp
          </button>
        </div>

        <div className="modal-body" style={{ marginTop: '1rem' }}>
          {activeTab === 'email' ? (
            <>
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
            </>
          ) : (
            <div style={{ marginBottom: '1rem' }}>
              <label className="label-text" htmlFor="wa-body" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <MessageCircle size={14} style={{ color: '#25d366' }} />
                WhatsApp Message
              </label>
              <div style={{
                padding: '1rem',
                backgroundColor: 'var(--scrollbar-track)',
                border: '1px solid var(--card-border)',
                borderRadius: '12px',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                fontFamily: "'Outfit', sans-serif",
                maxHeight: '400px',
                overflowY: 'auto',
                direction: 'auto',
                color: 'var(--text-main)'
              }}>
                {whatsappBody}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'flex-end',
          marginTop: '1.25rem',
          borderTop: '1px solid var(--card-border)',
          paddingTop: '1rem',
          flexWrap: 'wrap'
        }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ fontSize: '0.8rem' }}>
            Cancel
          </button>

          {activeTab === 'email' ? (
            <>
              <button type="button" className="btn btn-secondary" onClick={handleCopyEmail} style={{ fontSize: '0.8rem' }}>
                {copied === 'email' ? <Check size={14} style={{ color: 'var(--success-color)' }} /> : <Copy size={14} />}
                {copied === 'email' ? 'Copied!' : 'Copy Text'}
              </button>

              <button type="button" className="btn btn-secondary" onClick={handleOpenGmail} style={{ fontSize: '0.8rem' }}>
                <Mail size={14} style={{ color: '#ea4335' }} />
                Open Gmail
              </button>

              <button type="button" className="btn btn-primary" onClick={handleOpenClient} style={{ fontSize: '0.8rem' }}>
                <Mail size={14} />
                Mail Client
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCopyWhatsApp}
                style={{
                  fontSize: '0.8rem',
                  backgroundColor: copied === 'whatsapp' ? 'var(--success-bg)' : undefined,
                  borderColor: copied === 'whatsapp' ? 'var(--success-border)' : undefined,
                  color: copied === 'whatsapp' ? 'var(--success-color)' : undefined
                }}
              >
                {copied === 'whatsapp' ? <Check size={14} /> : <Copy size={14} />}
                {copied === 'whatsapp' ? 'Copied!' : 'Copy Message'}
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleOpenWhatsApp}
                style={{
                  fontSize: '0.8rem',
                  backgroundColor: '#25d366',
                  borderColor: '#25d366'
                }}
              >
                <MessageCircle size={14} />
                Open WhatsApp
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
