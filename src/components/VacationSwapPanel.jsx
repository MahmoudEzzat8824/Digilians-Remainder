import React, { useState } from 'react';
import { CalendarOff, ArrowLeftRight, Trash2, Plus, RefreshCw } from 'lucide-react';

export default function VacationSwapPanel({
  daysOff,
  onAddDayOff,
  onDeleteDayOff,
  swappedDays,
  onAddSwap,
  onDeleteSwap
}) {
  const [activeTab, setActiveTab] = useState('dayoff'); // 'dayoff' or 'swap'
  
  // Day off form state
  const [dayOffLabel, setDayOffLabel] = useState('');
  const [dayOffStart, setDayOffStart] = useState('');
  const [dayOffEnd, setDayOffEnd] = useState('');

  // Swap form state
  const [swapDate1, setSwapDate1] = useState('');
  const [swapDate2, setSwapDate2] = useState('');

  const submitDayOff = (e) => {
    e.preventDefault();
    if (!dayOffStart || !dayOffEnd) {
      alert("Please fill in both start and end dates.");
      return;
    }
    if (new Date(dayOffStart) > new Date(dayOffEnd)) {
      alert("Start Date cannot be after End Date.");
      return;
    }
    onAddDayOff({
      label: dayOffLabel.trim() || 'Day Off',
      startDate: dayOffStart,
      endDate: dayOffEnd
    });
    // reset form
    setDayOffLabel('');
    setDayOffStart('');
    setDayOffEnd('');
  };

  const submitSwap = (e) => {
    e.preventDefault();
    if (!swapDate1 || !swapDate2) {
      alert("Please select both dates to swap.");
      return;
    }
    if (swapDate1 === swapDate2) {
      alert("Cannot swap a date with itself.");
      return;
    }
    onAddSwap(swapDate1, swapDate2);
    setSwapDate1('');
    setSwapDate2('');
  };

  // Helper to format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="card" style={{ marginTop: '0rem' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('dayoff')}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'dayoff' ? '3px solid var(--accent-color)' : 'none',
            color: activeTab === 'dayoff' ? 'var(--accent-color)' : 'var(--text-muted)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            outline: 'none'
          }}
        >
          <CalendarOff size={16} />
          Days Off
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('swap')}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'swap' ? '3px solid var(--accent-color)' : 'none',
            color: activeTab === 'swap' ? 'var(--accent-color)' : 'var(--text-muted)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            outline: 'none'
          }}
        >
          <ArrowLeftRight size={16} />
          Swap Days
        </button>
      </div>

      {activeTab === 'dayoff' ? (
        <div>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            <CalendarOff size={18} style={{ color: 'var(--accent-color)' }} />
            Add Project Day Off
          </h3>

          <form onSubmit={submitDayOff} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label className="label-text" htmlFor="dayoff-label-input">Holiday / Day Off Name</label>
              <input
                id="dayoff-label-input"
                type="text"
                className="input-control"
                placeholder="e.g. Eid Holiday, National Day"
                value={dayOffLabel}
                onChange={(e) => setDayOffLabel(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <label className="label-text" htmlFor="dayoff-start-input">Start Date</label>
                <input
                  id="dayoff-start-input"
                  type="date"
                  className="input-control"
                  value={dayOffStart}
                  onChange={(e) => setDayOffStart(e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="label-text" htmlFor="dayoff-end-input">End Date</label>
                <input
                  id="dayoff-end-input"
                  type="date"
                  className="input-control"
                  value={dayOffEnd}
                  onChange={(e) => setDayOffEnd(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }}>
              <Plus size={16} />
              Add Day Off
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Days Off ({daysOff.length})
            </h4>

            {daysOff.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>
                No active days off scheduled.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                {daysOff.map(d => (
                  <div
                    key={d.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'var(--scrollbar-track)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '8px',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block', color: 'var(--text-main)' }}>{d.label}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        🏖️ {formatDate(d.startDate)} to {formatDate(d.endDate)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem', minWidth: 'auto', color: 'var(--danger-color)', height: '28px', width: '28px' }}
                      onClick={() => onDeleteDayOff(d.id)}
                      title="Delete Day Off"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            <ArrowLeftRight size={18} style={{ color: 'var(--accent-color)' }} />
            Swap Day Schedules
          </h3>

          <form onSubmit={submitSwap} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label className="label-text" htmlFor="swap-date1-input">Date 1</label>
                <input
                  id="swap-date1-input"
                  type="date"
                  className="input-control"
                  value={swapDate1}
                  onChange={(e) => setSwapDate1(e.target.value)}
                />
              </div>
              
              <div style={{ display: 'flex', alignSelf: 'flex-end', paddingBottom: '0.6rem', color: 'var(--text-muted)' }}>
                <ArrowLeftRight size={16} />
              </div>

              <div style={{ flex: 1 }}>
                <label className="label-text" htmlFor="swap-date2-input">Date 2</label>
                <input
                  id="swap-date2-input"
                  type="date"
                  className="input-control"
                  value={swapDate2}
                  onChange={(e) => setSwapDate2(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }}>
              <RefreshCw size={16} />
              Swap Days
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Swaps ({swappedDays.length})
            </h4>

            {swappedDays.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>
                No day swaps active.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                {swappedDays.map(s => (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'var(--scrollbar-track)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '8px',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.75rem', display: 'block' }}>
                        🔄 Swapped Days
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {formatDate(s.date1)} ⟷ {formatDate(s.date2)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem', minWidth: 'auto', color: 'var(--danger-color)', height: '28px', width: '28px' }}
                      onClick={() => onDeleteSwap(s.id)}
                      title="Remove Swap"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
