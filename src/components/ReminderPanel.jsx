import React from 'react';
import { Mail, Plus, AlertCircle, RefreshCw } from 'lucide-react';

export default function ReminderPanel({ occurrences, instructorEmailMap, getInstructorEmail, onComposeEmail, onEditSession }) {
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
        return a.time.localeCompare(b.time);
      })
    }));
  }, [occurrences, instructorEmailMap, getInstructorEmail]);

  const handleComposeEmail = (group) => {
    onComposeEmail(group.instructor, group.sessions, group.email);
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
