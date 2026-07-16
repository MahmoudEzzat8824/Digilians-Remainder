import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, CalendarOff, ArrowLeftRight, Trash2, Check } from 'lucide-react';

export default function InteractiveCalendar({
  filters,
  setFilters,
  daysOff,
  onAddDayOff,
  onDeleteDayOff,
  swappedDays,
  onAddSwap,
  onDeleteSwap,
  getSessionsForDate,
  getScheduleWeekAndDay
}) {
  const initialDateStr = filters.fromDate || new Date().toISOString().slice(0, 10);
  const [year, month] = initialDateStr.split('-').map(Number);
  
  const [currentYear, setCurrentYear] = useState(year || 2026);
  const [currentMonth, setCurrentMonth] = useState(month - 1 || 6); // 0-indexed, default July (6)

  // Quick Action form state for selected date
  const [showDayOffForm, setShowDayOffForm] = useState(false);
  const [dayOffLabel, setDayOffLabel] = useState('');
  
  const [showSwapForm, setShowSwapForm] = useState(false);
  const [swapTargetDate, setSwapTargetDate] = useState('');

  // Hover Tooltip state
  const [hoveredDate, setHoveredDate] = useState(null);
  const tooltipRef = useRef({ x: 0, y: 0 });
  const tooltipElRef = useRef(null);

  // Custom Right-Click Context Menu state
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, dateStr: null });

  // Close context menu on any click outside
  useEffect(() => {
    const handleClose = () => {
      setContextMenu(prev => ({ ...prev, visible: false }));
    };
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, []);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Generate calendar days
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();
  
  const days = [];
  
  // Previous month's trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthTotalDays - i;
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    days.push({
      dayNum: d,
      dateStr: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      isCurrentMonth: false
    });
  }
  
  // Current month's days
  for (let d = 1; d <= totalDays; d++) {
    days.push({
      dayNum: d,
      dateStr: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      isCurrentMonth: true
    });
  }
  
  // Next month's leading days
  const remainingCells = 42 - days.length;
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    days.push({
      dayNum: d,
      dateStr: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      isCurrentMonth: false
    });
  }

  const selectedDateStr = filters.fromDate; // Active filter date

  // Find info for selected date
  const selectedDayOff = daysOff.find(d => selectedDateStr >= d.startDate && selectedDateStr <= d.endDate);
  const selectedSwap = swappedDays.find(s => s.date1 === selectedDateStr || s.date2 === selectedDateStr);
  const selectedSwapTargetStr = selectedSwap ? (selectedSwap.date1 === selectedDateStr ? selectedSwap.date2 : selectedSwap.date1) : null;

  const handleDayClick = (dateStr) => {
    setFilters(prev => ({
      ...prev,
      dateMode: 'today',
      fromDate: dateStr,
      toDate: dateStr
    }));
    setShowDayOffForm(false);
    setDayOffLabel('');
    setShowSwapForm(false);
    setSwapTargetDate('');
  };

  const handleContextMenu = (e, dateStr) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      dateStr: dateStr
    });
    // Automatically select the day too
    setFilters(prev => ({
      ...prev,
      dateMode: 'today',
      fromDate: dateStr,
      toDate: dateStr
    }));
    // Hide forms initially
    setShowDayOffForm(false);
    setShowSwapForm(false);
  };

  const handleMouseEnter = useCallback((e, dateStr) => {
    setHoveredDate(dateStr);
    tooltipRef.current = { x: e.clientX + 15, y: e.clientY + 15 };
    if (tooltipElRef.current) {
      tooltipElRef.current.style.top = `${e.clientY + 15}px`;
      tooltipElRef.current.style.left = `${e.clientX + 15}px`;
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    tooltipRef.current = { x: e.clientX + 15, y: e.clientY + 15 };
    if (tooltipElRef.current) {
      tooltipElRef.current.style.top = `${e.clientY + 15}px`;
      tooltipElRef.current.style.left = `${e.clientX + 15}px`;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredDate(null);
  }, []);

  const handleAddDayOffSubmit = (e) => {
    e.preventDefault();
    if (!selectedDateStr) return;
    onAddDayOff({
      label: dayOffLabel.trim() || 'Day Off',
      startDate: selectedDateStr,
      endDate: selectedDateStr
    });
    setDayOffLabel('');
    setShowDayOffForm(false);
  };

  const handleAddSwapSubmit = (e) => {
    e.preventDefault();
    if (!selectedDateStr || !swapTargetDate) return;
    if (selectedDateStr === swapTargetDate) {
      alert("Cannot swap a day with itself.");
      return;
    }
    onAddSwap(selectedDateStr, swapTargetDate);
    setSwapTargetDate('');
    setShowSwapForm(false);
  };

  const trackColors = {
    'Coaching': 'track-coaching',
    'Data Analysis': 'track-data-analysis',
    'Media Production': 'track-media-production',
    'Innov/Prompt': 'track-innov-prompt'
  };

  const renderTooltipContent = () => {
    if (!hoveredDate) return null;
    const { week, day, formattedDate } = getScheduleWeekAndDay(hoveredDate);
    const dayOff = daysOff.find(doff => hoveredDate >= doff.startDate && hoveredDate <= doff.endDate);
    const swap = swappedDays.find(s => s.date1 === hoveredDate || s.date2 === hoveredDate);
    const swappedWithFormatted = swap ? getScheduleWeekAndDay(swap.date1 === hoveredDate ? swap.date2 : swap.date1).formattedDate : null;

    const sessions = getSessionsForDate(hoveredDate);

    return (
      <div>
        <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '0.35rem', marginBottom: '0.5rem' }}>
          <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block' }}>{formattedDate} - {day}</strong>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{week}</span>
        </div>

        {dayOff && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--danger-color)', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>🏖️ Project Day Off: {dayOff.label}</span>
          </div>
        )}

        {swap && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--success-color)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            <span>🔄 Swapped with {swappedWithFormatted}</span>
          </div>
        )}

        {!dayOff && sessions.length === 0 && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {day === 'Thursday' || day === 'Friday' ? "Weekend rest day" : "No scheduled sessions"}
          </div>
        )}

        {!dayOff && sessions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Scheduled Sessions ({sessions.length}):
            </div>
            {sessions.map((s, idx) => {
              const colorClass = trackColors[s.track] || 'track-default';
              return (
                <div key={idx} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '0.35rem',
                  backgroundColor: 'var(--scrollbar-track)',
                  borderRadius: '6px',
                  borderLeft: '3px solid var(--accent-color)',
                  fontSize: '0.75rem',
                  lineHeight: 1.2
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--text-main)', gap: '0.5rem' }}>
                    <span>{s.time}</span>
                    <span className={`badge ${colorClass}`} style={{ fontSize: '0.6rem', padding: '0.05rem 0.25rem', height: '16px' }}>{s.track}</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', marginTop: '0.15rem', fontSize: '0.7rem' }}>
                    👤 {s.trainer} | 🏢 {s.lab}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="card calendar-container" style={{ position: 'relative' }}>
      <div className="calendar-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} style={{ color: 'var(--accent-color)' }} />
          <span>{months[currentMonth]} {currentYear}</span>
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem', minWidth: 'auto' }} onClick={handlePrevMonth}>
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
            onClick={() => {
              const now = new Date();
              const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
              setCurrentYear(now.getFullYear());
              setCurrentMonth(now.getMonth());
              setFilters(prev => ({
                ...prev,
                dateMode: 'today',
                fromDate: todayStr,
                toDate: todayStr
              }));
            }}
          >
            Today
          </button>
          <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem', minWidth: 'auto' }} onClick={handleNextMonth}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="calendar-weekday">{d}</div>
        ))}

        {days.map((day, idx) => {
          const daySessions = getSessionsForDate(day.dateStr);
          const isSelected = selectedDateStr === day.dateStr;
          const dayOff = daysOff.find(doff => day.dateStr >= doff.startDate && day.dateStr <= doff.endDate);
          const swap = swappedDays.find(s => s.date1 === day.dateStr || s.date2 === day.dateStr);
          
          const dateObj = new Date(day.dateStr + 'T00:00:00');
          const isWeekend = dateObj.getDay() === 4 || dateObj.getDay() === 5; // Thursday/Friday

          let cellClass = 'calendar-cell';
          if (isSelected) cellClass += ' selected';
          if (!day.isCurrentMonth) cellClass += ' other-month';
          if (dayOff) cellClass += ' day-off-cell';
          else if (swap) cellClass += ' swapped-cell';
          else if (isWeekend) cellClass += ' weekend';

          return (
            <div
              key={idx}
              className={cellClass}
              onClick={() => handleDayClick(day.dateStr)}
              onContextMenu={(e) => handleContextMenu(e, day.dateStr)}
              onMouseEnter={(e) => handleMouseEnter(e, day.dateStr)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span className="calendar-day-number">{day.dayNum}</span>
                {dayOff && <span style={{ fontSize: '0.65rem' }}>🏖️</span>}
                {swap && <span style={{ fontSize: '0.65rem' }}>🔄</span>}
              </div>

              <div className="calendar-day-badges">
                {dayOff ? (
                  <span className="calendar-session-badge" style={{ backgroundColor: 'var(--danger-border)', color: 'var(--danger-text)' }} title={dayOff.label}>
                    {dayOff.label}
                  </span>
                ) : swap ? (
                  <span className="calendar-session-badge" style={{ backgroundColor: 'var(--success-border)', color: 'var(--success-text)' }}>
                    Swapped
                  </span>
                ) : (
                  daySessions.slice(0, 3).map((session, sIdx) => {
                    const colorClass = trackColors[session.track] || 'track-default';
                    return (
                      <span key={sIdx} className={`calendar-session-badge ${colorClass}`} title={`${session.time} | ${session.trainer}`}>
                        {session.time.split(' ')[0]} {session.trainer.split(' ')[0]}
                      </span>
                    );
                  })
                )}
                {!dayOff && !swap && daySessions.length > 3 && (
                  <span className="calendar-meta-badge">
                    +{daySessions.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredDate && (
        <div ref={tooltipElRef} style={{
          position: 'fixed',
          top: tooltipRef.current.y,
          left: tooltipRef.current.x,
          zIndex: 1050,
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
          padding: '0.75rem',
          minWidth: '220px',
          maxWidth: '300px',
          pointerEvents: 'none',
          backdropFilter: 'blur(12px)',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          {renderTooltipContent()}
        </div>
      )}

      {/* Right-Click Custom Context Menu */}
      {contextMenu.visible && (
        <div style={{
          position: 'fixed',
          top: contextMenu.y,
          left: contextMenu.x,
          zIndex: 1100,
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
          padding: '0.4rem',
          minWidth: '170px',
          backdropFilter: 'blur(16px)',
          animation: 'fadeIn 0.1s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="context-menu-item"
            onClick={() => {
              setFilters(prev => ({ ...prev, dateMode: 'today', fromDate: contextMenu.dateStr, toDate: contextMenu.dateStr }));
              setContextMenu(prev => ({ ...prev, visible: false }));
            }}
          >
            <Calendar size={14} />
            Filter to this day
          </button>

          {!daysOff.some(d => contextMenu.dateStr >= d.startDate && contextMenu.dateStr <= d.endDate) && 
           !swappedDays.some(s => s.date1 === contextMenu.dateStr || s.date2 === contextMenu.dateStr) && (
            <>
              <button
                type="button"
                className="context-menu-item"
                onClick={() => {
                  setShowDayOffForm(true);
                  setShowSwapForm(false);
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
              >
                <CalendarOff size={14} />
                Set Day Off
              </button>
              <button
                type="button"
                className="context-menu-item"
                onClick={() => {
                  setShowSwapForm(true);
                  setShowDayOffForm(false);
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
              >
                <ArrowLeftRight size={14} />
                Swap Day
              </button>
            </>
          )}

          {daysOff.find(d => contextMenu.dateStr >= d.startDate && contextMenu.dateStr <= d.endDate) && (
            <button
              type="button"
              className="context-menu-item context-menu-danger"
              onClick={() => {
                const dayOff = daysOff.find(d => contextMenu.dateStr >= d.startDate && contextMenu.dateStr <= d.endDate);
                if (dayOff) onDeleteDayOff(dayOff.id);
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
            >
              <Trash2 size={14} />
              Remove Day Off
            </button>
          )}

          {swappedDays.find(s => s.date1 === contextMenu.dateStr || s.date2 === contextMenu.dateStr) && (
            <button
              type="button"
              className="context-menu-item context-menu-danger"
              onClick={() => {
                const swap = swappedDays.find(s => s.date1 === contextMenu.dateStr || s.date2 === contextMenu.dateStr);
                if (swap) onDeleteSwap(swap.id);
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
            >
              <Trash2 size={14} />
              Remove Day Swap
            </button>
          )}
        </div>
      )}

      {selectedDateStr && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: 'var(--scrollbar-track)',
          border: '1px solid var(--card-border)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                Selected Date
              </span>
              <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
                {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </strong>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {!selectedDayOff && !selectedSwap && (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', height: '32px' }}
                    onClick={() => { setShowDayOffForm(prev => !prev); setShowSwapForm(false); }}
                  >
                    <CalendarOff size={12} />
                    Set Day Off
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', height: '32px' }}
                    onClick={() => { setShowSwapForm(prev => !prev); setShowDayOffForm(false); }}
                  >
                    <ArrowLeftRight size={12} />
                    Swap Day
                  </button>
                </>
              )}

              {selectedDayOff && (
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', height: '32px' }}
                  onClick={() => onDeleteDayOff(selectedDayOff.id)}
                >
                  <Trash2 size={12} />
                  Remove Day Off
                </button>
              )}

              {selectedSwap && (
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', height: '32px' }}
                  onClick={() => onDeleteSwap(selectedSwap.id)}
                >
                  <Trash2 size={12} />
                  Remove Day Swap
                </button>
              )}
            </div>
          </div>

          {showDayOffForm && (
            <form onSubmit={handleAddDayOffSubmit} style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--card-border)', paddingTop: '0.75rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="label-text" htmlFor="cal-dayoff-label">Holiday / Day Off Name</label>
                <input
                  id="cal-dayoff-label"
                  type="text"
                  placeholder="e.g. Eid Holiday"
                  className="input-control"
                  style={{ padding: '0.4rem 0.75rem', height: '32px' }}
                  value={dayOffLabel}
                  onChange={(e) => setDayOffLabel(e.target.value)}
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '32px', padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
                <Check size={14} />
                Save Day Off
              </button>
            </form>
          )}

          {showSwapForm && (
            <form onSubmit={handleAddSwapSubmit} style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--card-border)', paddingTop: '0.75rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="label-text" htmlFor="cal-swap-date">Select Date to Swap With</label>
                <input
                  id="cal-swap-date"
                  type="date"
                  className="input-control"
                  style={{ padding: '0.4rem 0.75rem', height: '32px' }}
                  value={swapTargetDate}
                  onChange={(e) => setSwapTargetDate(e.target.value)}
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '32px', padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
                <Check size={14} />
                Confirm Swap
              </button>
            </form>
          )}

          {(selectedDayOff || selectedSwap) && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--card-border)', paddingTop: '0.5rem' }}>
              {selectedDayOff && <span>🏖️ Currently marked as project-wide Day Off: <strong>{selectedDayOff.label}</strong>.</span>}
              {selectedSwap && <span>🔄 Currently swapped: sessions are loaded from <strong>{new Date(selectedSwapTargetStr + 'T00:00:00').toLocaleDateString('en-GB')}</strong>.</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
