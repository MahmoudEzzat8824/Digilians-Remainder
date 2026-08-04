import React from 'react';
import { Clock, Monitor, User, Coffee, CalendarRange, RefreshCw, Tag } from 'lucide-react';

export default function ScheduleList({ selectedDates, getScheduleWeekAndDay, occurrences, onEditSession, swappedDays }) {
  if (selectedDates.length === 0) {
    return (
      <div className="card placeholder-text">
        <CalendarRange size={36} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
        <p>No dates selected. Select a valid date range.</p>
      </div>
    );
  }

  // Helper: parse time string like "10:00 - 12:00" into minutes for comparison
  const parseTimeToMinutes = (timeStr) => {
    const parts = timeStr.split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  };

  const renderedDays = selectedDates.map(dateStr => {
    const { week, day, formattedDate } = getScheduleWeekAndDay(dateStr);
    if (!week || !day) return null;

    const swap = swappedDays?.find(s => s.date1 === dateStr || s.date2 === dateStr);
    const swappedWithFormatted = swap ? getScheduleWeekAndDay(swap.date1 === dateStr ? swap.date2 : swap.date1).formattedDate : null;

    const daySessions = occurrences.filter(occurrence => occurrence.dateStr === dateStr);

    // Sort ascending by time
    daySessions.sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));

    // Group by instructor
    const instructorGroupsMap = new Map();
    daySessions.forEach(session => {
      const key = session.trainer || 'Unknown';
      if (!instructorGroupsMap.has(key)) instructorGroupsMap.set(key, []);
      instructorGroupsMap.get(key).push(session);
    });

    // Sort instructor groups by their earliest session time (ascending)
    const instructorGroups = [...instructorGroupsMap.entries()].sort((a, b) => {
      const earliestA = Math.min(...a[1].map(s => parseTimeToMinutes(s.time)));
      const earliestB = Math.min(...b[1].map(s => parseTimeToMinutes(s.time)));
      return earliestA - earliestB;
    });

    const targetDateStr = swap ? (swap.date1 === dateStr ? swap.date2 : swap.date1) : dateStr;
    const targetDayObj = getScheduleWeekAndDay(targetDateStr);
    const targetIsWeekend = targetDayObj.day === 'Thursday' || targetDayObj.day === 'Friday';

    if (targetIsWeekend && daySessions.length === 0) {
      return (
        <div key={dateStr} className="day-group">
          <h3 className="day-title">
            <span>{formattedDate} - {day}</span>
            <span className="badge badge-track" style={{ fontSize: '0.7rem' }}>{week}</span>
            {swappedWithFormatted && (
              <span className="badge badge-success" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <RefreshCw size={10} />
                Swapped with {swappedWithFormatted}
              </span>
            )}
          </h3>
          <div className="weekend-box">
            <Coffee size={20} />
            {swap ? `Take a rest! Swapped with weekend (${swappedWithFormatted}) 🎉` : "Take a rest! It's the weekend. 🎉"}
          </div>
        </div>
      );
    }

    return (
      <div key={dateStr} className="day-group">
        <h3 className="day-title">
          <span>{formattedDate} - {day}</span>
          <span className="badge badge-track" style={{ fontSize: '0.7rem' }}>{week}</span>
          {swappedWithFormatted && (
            <span className="badge badge-success" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <RefreshCw size={10} />
              Swapped with {swappedWithFormatted}
            </span>
          )}
        </h3>

        {daySessions.length === 0 ? (
          <div className="card placeholder-text" style={{ padding: '2rem 1.5rem', marginBottom: 0 }}>
            No matching sessions for this date and selected filters.
          </div>
        ) : (
          <>
            {/* Desktop Table View - Grouped by Instructor */}
            <div className="table-container desktop-session-table">
              {instructorGroups.map(([instructor, sessions], gIdx) => (
                <div key={gIdx} style={{ marginBottom: gIdx < instructorGroups.length - 1 ? '1rem' : 0 }}>
                  {/* Instructor Group Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'var(--accent-light)',
                    borderRadius: '10px 10px 0 0',
                    border: '1px solid var(--card-border)',
                    borderBottom: 'none'
                  }}>
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: 'var(--accent-color)'
                    }}>
                      <User size={15} />
                      {instructor}
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '6px',
                      backgroundColor: 'var(--card-bg)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--card-border)'
                    }}>
                      {sessions.length} session{sessions.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <table className="session-table" style={{ borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Track</th>
                        <th>Category</th>
                        <th>Lab</th>
                        <th style={{ width: '80px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((session, idx) => (
                        <tr key={`${session.track}-${session.trainer}-${session.time}-${idx}`}>
                          <td className="time-col" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                              {session.time}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-track">{session.track}</span>
                          </td>
                          <td>{session.category}</td>
                          <td>
                            <span className="badge badge-lab">
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Monitor size={12} />
                                {session.lab}
                              </span>
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              {session.originalTrainer && session.originalTrainer !== session.trainer && (
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                                  (ex: {session.originalTrainer})
                                </span>
                              )}
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '0.25rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', minWidth: 'auto', height: '22px' }}
                                onClick={() => onEditSession(session)}
                                title="Replace Instructor for this session"
                              >
                                <RefreshCw size={10} />
                                Replace
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {/* Mobile Session Cards View - Grouped by Instructor */}
            <div className="mobile-session-list">
              {instructorGroups.map(([instructor, sessions], gIdx) => (
                <div key={gIdx} style={{ marginBottom: gIdx < instructorGroups.length - 1 ? '0.75rem' : 0 }}>
                  {/* Mobile Instructor Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'var(--accent-light)',
                    borderRadius: '10px 10px 0 0',
                    border: '1px solid var(--card-border)',
                    borderBottom: 'none',
                    marginBottom: '-1px'
                  }}>
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: 'var(--accent-color)'
                    }}>
                      <User size={15} />
                      {instructor}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '6px',
                      backgroundColor: 'var(--card-bg)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--card-border)'
                    }}>
                      {sessions.length}
                    </span>
                  </div>

                  {sessions.map((session, idx) => (
                    <div
                      key={`${session.track}-${session.trainer}-${session.time}-${idx}`}
                      className="mobile-session-card"
                      style={{
                        borderRadius: idx === sessions.length - 1 ? '0 0 10px 10px' : '0',
                        borderTop: idx === 0 ? '1px solid var(--card-border)' : 'none'
                      }}
                    >
                      <div className="mobile-session-card-header">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                          <Clock size={16} style={{ color: 'var(--accent-color)' }} />
                          {session.time}
                        </span>
                        <span className="badge badge-track">{session.track}</span>
                      </div>

                      <div className="mobile-session-card-body">
                        <div className="mobile-session-card-row">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                            <User size={14} style={{ color: 'var(--accent-color)' }} />
                            {session.trainer}
                          </span>

                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', height: '26px' }}
                            onClick={() => onEditSession(session)}
                          >
                            <RefreshCw size={12} />
                            Replace
                          </button>
                        </div>

                        {session.originalTrainer && session.originalTrainer !== session.trainer && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Originally: {session.originalTrainer}
                          </div>
                        )}

                        <div className="mobile-session-card-row" style={{ marginTop: '0.25rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <Tag size={13} />
                            {session.category}
                          </span>

                          <span className="badge badge-lab">
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Monitor size={12} />
                              {session.lab}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  });

  return (
    <div className="card">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>Training Schedule</h2>
      </div>
      {renderedDays}
    </div>
  );
}
