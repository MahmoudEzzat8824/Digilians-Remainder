import React from 'react';
import { Clock, Monitor, User, Coffee, CalendarRange } from 'lucide-react';

export default function ScheduleList({ selectedDates, getScheduleWeekAndDay, occurrences }) {
  if (selectedDates.length === 0) {
    return (
      <div className="card placeholder-text">
        <CalendarRange size={36} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
        <p>No dates selected. Select a valid date range.</p>
      </div>
    );
  }

  const renderedDays = selectedDates.map(dateStr => {
    const { week, day, formattedDate } = getScheduleWeekAndDay(dateStr);
    if (!week || !day) return null;

    if (day === 'Thursday' || day === 'Friday') {
      return (
        <div key={dateStr} className="day-group">
          <h3 className="day-title">
            <span>{formattedDate} - {day}</span>
            <span className="badge badge-track" style={{ fontSize: '0.7rem' }}>{week}</span>
          </h3>
          <div className="weekend-box">
            <Coffee size={20} />
            Take a rest! It's the weekend. 🎉
          </div>
        </div>
      );
    }

    const daySessions = occurrences.filter(occurrence => occurrence.dateStr === dateStr);

    daySessions.sort((a, b) => {
      const timeA = parseInt(a.time.split(':')[0]) || 0;
      const timeB = parseInt(b.time.split(':')[0]) || 0;
      return timeA - timeB;
    });

    return (
      <div key={dateStr} className="day-group">
        <h3 className="day-title">
          <span>{formattedDate} - {day}</span>
          <span className="badge badge-track" style={{ fontSize: '0.7rem' }}>{week}</span>
        </h3>

        {daySessions.length === 0 ? (
          <div className="card placeholder-text" style={{ padding: '2rem 1.5rem', marginBottom: 0 }}>
            No matching sessions for this date and selected filters.
          </div>
        ) : (
          <div className="table-container">
            <table className="session-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Track</th>
                  <th>Instructor</th>
                  <th>Category</th>
                  <th>Lab</th>
                </tr>
              </thead>
              <tbody>
                {daySessions.map((session, idx) => (
                  <tr key={idx}>
                    <td className="time-col" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                        {session.time}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-track">{session.track}</span>
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-color)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <User size={12} />
                          {session.trainer}
                        </span>
                      </span>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
