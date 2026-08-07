import React, { useState } from 'react';
import { RefreshCw, Copy, Check, MessageCircle } from 'lucide-react';

export default function ReminderPanel({ occurrences, onPreviewWhatsApp, onSendWhatsApp, onEditSession, buildWhatsAppText }) {
  const [copiedId, setCopiedId] = useState(null); // tracks which card was copied

  const grouped = React.useMemo(() => {
    const groupedMap = new Map();

    occurrences.forEach(occurrence => {
      const instructor = occurrence.trainer || 'Unknown';
      if (!groupedMap.has(instructor)) {
        groupedMap.set(instructor, []);
      }
      groupedMap.get(instructor).push(occurrence);
    });

    return [...groupedMap.entries()].map(([instructor, sessions]) => ({
      instructor,
      sessions: sessions.sort((a, b) => {
        const dateA = a.dateStr.localeCompare(b.dateStr);
        if (dateA !== 0) return dateA;
        // Sort by time ascending using numeric comparison
        const timePartsA = a.time.split(':').map(Number);
        const timePartsB = b.time.split(':').map(Number);
        const minutesA = (timePartsA[0] || 0) * 60 + (timePartsA[1] || 0);
        const minutesB = (timePartsB[0] || 0) * 60 + (timePartsB[1] || 0);
        return minutesA - minutesB;
      })
    }));
  }, [occurrences]);

  const handleCopyWhatsApp = async (group) => {
    if (!buildWhatsAppText) return;
    try {
      const text = buildWhatsAppText(group.instructor, group.sessions);
      await navigator.clipboard.writeText(text);
      setCopiedId(`wa-${group.instructor}`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSendWhatsApp = (group) => {
    if (!onSendWhatsApp) return;
    onSendWhatsApp(group.instructor, group.sessions, 'Reminder card');
  };

  const handlePreviewWhatsApp = (group) => {
    if (!onPreviewWhatsApp) return;
    onPreviewWhatsApp(group.instructor, group.sessions);
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2>WhatsApp Reminders</h2>
        <span className="badge badge-track">{grouped.length} Instructor{grouped.length === 1 ? '' : 's'}</span>
      </div>

      {grouped.length === 0 ? (
        <p className="placeholder-text" style={{ padding: '2rem 1rem' }}>
          No instructors scheduled for the selected filters.
        </p>
      ) : (
        <div className="reminder-cards-list">
          {grouped.map((group, index) => (
            <div key={index} className="reminder-card">
              <div className="reminder-card-header">
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{group.instructor}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                    WhatsApp reminders only
                  </span>
                </div>
                
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                  onClick={() => handlePreviewWhatsApp(group)}
                >
                  <MessageCircle size={12} />
                  Preview WhatsApp
                </button>
              </div>

              {/* Quick Action Buttons Row */}
              <div style={{
                display: 'flex',
                gap: '0.4rem',
                flexWrap: 'wrap',
                padding: '0.5rem 0',
                borderBottom: '1px solid var(--card-border)',
                marginBottom: '0.5rem'
              }}>
                {/* Copy WhatsApp Text */}
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.7rem',
                    height: '28px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    backgroundColor: copiedId === `wa-${group.instructor}` ? 'var(--success-bg)' : undefined,
                    borderColor: copiedId === `wa-${group.instructor}` ? 'var(--success-border)' : undefined,
                    color: copiedId === `wa-${group.instructor}` ? 'var(--success-color)' : undefined
                  }}
                  onClick={() => handleCopyWhatsApp(group)}
                  title="Copy formatted WhatsApp message"
                >
                  {copiedId === `wa-${group.instructor}` ? (
                    <><Check size={11} /> Copied!</>
                  ) : (
                    <><MessageCircle size={11} /> Copy WhatsApp</>
                  )}
                </button>

                {/* Open WhatsApp Web */}
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.7rem',
                    height: '28px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    backgroundColor: 'rgba(37, 211, 102, 0.08)',
                    borderColor: 'rgba(37, 211, 102, 0.3)',
                    color: '#25d366'
                  }}
                  onClick={() => handleSendWhatsApp(group)}
                  title="Open WhatsApp with this message"
                >
                  <MessageCircle size={11} />
                  Send WhatsApp
                </button>
              </div>

              <ul className="reminder-list">
                {group.sessions.map((session, sIdx) => (
                  <li key={sIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '0.5rem', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                      <span>📅 {session.formattedDate}</span>
                      <span>• {session.time}</span>
                      <span>• {session.track}</span>
                      <span>• {session.lab}</span>
                      {session.originalTrainer && session.originalTrainer !== session.trainer && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontStyle: 'italic', fontWeight: 600 }}>
                          (ex: {session.originalTrainer})
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.6rem', height: '18px', display: 'flex', alignItems: 'center', gap: '0.15rem' }}
                      onClick={() => onEditSession(session)}
                      title="Replace Instructor"
                    >
                      <RefreshCw size={8} />
                      Replace
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
