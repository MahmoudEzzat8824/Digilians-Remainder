import React, { useState } from 'react';
import { Mail, Plus, AlertCircle, RefreshCw, Copy, Check, MessageCircle } from 'lucide-react';

export default function ReminderPanel({ occurrences, instructorEmailMap, getInstructorEmail, onComposeEmail, onEditSession, buildEmailText, buildWhatsAppText }) {
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
      email: getInstructorEmail(instructor),
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
  }, [occurrences, instructorEmailMap, getInstructorEmail]);

  const handleComposeEmail = (group) => {
    onComposeEmail(group.instructor, group.sessions, group.email);
  };

  const handleCopyEmail = async (group) => {
    if (!buildEmailText) return;
    try {
      const text = buildEmailText(group.instructor, group.sessions);
      await navigator.clipboard.writeText(text);
      setCopiedId(`email-${group.instructor}`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

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
    if (!buildWhatsAppText) return;
    const text = buildWhatsAppText(group.instructor, group.sessions);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2>Email Reminders</h2>
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
                  {group.email ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', wordBreak: 'break-all' }}>
                      {group.email}
                    </span>
                  ) : (
                    <span className="badge badge-danger" style={{ padding: '0.1rem 0.35rem', fontSize: '0.65rem', marginTop: '0.2rem', gap: '0.2rem' }}>
                      <AlertCircle size={10} />
                      Email Missing
                    </span>
                  )}
                </div>
                
                <button
                  type="button"
                  className={`btn ${group.email ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                  onClick={() => handleComposeEmail(group)}
                >
                  {group.email ? (
                    <>
                      <Mail size={12} />
                      Compose Email
                    </>
                  ) : (
                    <>
                      <Plus size={12} />
                      Missing Email
                    </>
                  )}
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
                {/* Copy Email Text */}
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
                    gap: '0.25rem'
                  }}
                  onClick={() => handleCopyEmail(group)}
                  title="Copy email text to clipboard"
                >
                  {copiedId === `email-${group.instructor}` ? (
                    <><Check size={11} style={{ color: 'var(--success-color)' }} /> Copied!</>
                  ) : (
                    <><Copy size={11} /> Copy Email</>
                  )}
                </button>

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
