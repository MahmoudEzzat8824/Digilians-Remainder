import React from 'react';
import { Clock, Monitor, User, Coffee, CalendarRange, RefreshCw } from 'lucide-react';

export default function ScheduleList({ selectedDates, getScheduleWeekAndDay, occurrences, onEditSession, swappedDays }) {
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

    const swap = swappedDays?.find(s => s.date1 === dateStr || s.date2 === dateStr);
    const swappedWithFormatted = swap ? getScheduleWeekAndDay(swap.date1 === dateStr ? swap.date2 : swap.date1).formattedDate : null;

    const daySessions = occurrences.filter(occurrence => occurrence.dateStr === dateStr);

    daySessions.sort((a, b) => {
      const timeA = parseInt(a.time.split(':')[0]) || 0;
      const timeB = parseInt(b.time.split(':')[0]) || 0;
      return timeA - timeB;
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
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-color)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <User size={12} />
                            {session.trainer}
                          </span>
                        </span>
                        {session.isOnVacation && (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span>🏖️ Vacation</span>
                          </span>
                        )}
                        {session.originalTrainer && session.originalTrainer !== session.trainer && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
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
