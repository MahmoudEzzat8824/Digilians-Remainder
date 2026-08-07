import React, { useState } from 'react';
import { Copy, Check, X, MessageCircle } from 'lucide-react';

export default function EmailPreviewModal({ emailData, onClose, onSendWhatsApp }) {
  const [copied, setCopied] = useState(null);

  const whatsappBody = emailData.whatsappBody || '';

  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(whatsappBody);
      setCopied('whatsapp');
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleOpenWhatsApp = () => {
    if (onSendWhatsApp) {
      onSendWhatsApp();
      return;
    }

    const url = `https://wa.me/?text=${encodeURIComponent(whatsappBody)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '640px', width: '92%' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageCircle size={20} style={{ color: '#25d366' }} />
            WhatsApp Message Preview
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ marginTop: '1rem' }}>
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
        </div>
      </div>
    </div>
  );
}
