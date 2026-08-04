import React, { useState, useRef } from 'react';
import { Search, X, Download, Upload, Filter, ChevronDown, ChevronUp, Calendar } from 'lucide-react';

function formatDateInput(d) {
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
}

export default function FilterPanel({
  filters,
  setFilters,
  tracks,
  instructors,
  labs,
  clearFilters,
  exportCsv,
  exportXlsx,
  handleFileUpload
}) {
  const fileInputRef = useRef(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleDateModeChange = (e) => {
    const mode = e.target.value;
    const today = formatDateInput(new Date());
    setFilters(prev => ({
      ...prev,
      dateMode: mode,
      fromDate: today,
      toDate: today
    }));
  };

  const handleQuickDateSelect = (type) => {
    const now = new Date();
    if (type === 'today') {
      const todayStr = formatDateInput(now);
      setFilters(prev => ({ ...prev, dateMode: 'today', fromDate: todayStr, toDate: todayStr }));
    } else if (type === 'tomorrow') {
      const tom = new Date(now);
      tom.setDate(tom.getDate() + 1);
      const tomStr = formatDateInput(tom);
      setFilters(prev => ({ ...prev, dateMode: 'today', fromDate: tomStr, toDate: tomStr }));
    } else if (type === 'thisWeek') {
      const start = new Date(now);
      const end = new Date(now);
      end.setDate(end.getDate() + 6);
      setFilters(prev => ({
        ...prev,
        dateMode: 'range',
        fromDate: formatDateInput(start),
        toDate: formatDateInput(end)
      }));
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Count active non-default filters
  const activeCount = [
    filters.track !== 'All',
    filters.instructor !== 'All',
    filters.lab !== 'All',
    Boolean(filters.search),
    filters.dateMode !== 'today'
  ].filter(Boolean).length;

  const todayStr = formatDateInput(new Date());
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  const tomorrowStr = formatDateInput(tom);

  const isTodaySelected = filters.dateMode === 'today' && filters.fromDate === todayStr;
  const isTomorrowSelected = filters.dateMode === 'today' && filters.fromDate === tomorrowStr;
  const isWeekSelected = filters.dateMode === 'range';

  return (
    <div className="card filters-section">
      {/* Mobile Accordion Header */}
      <button
        type="button"
        className="mobile-filter-accordion-toggle"
        onClick={() => setIsCollapsed(prev => !prev)}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} style={{ color: 'var(--accent-color)' }} />
          Filters & Options
          {activeCount > 0 && (
            <span className="badge badge-track" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
              {activeCount} active
            </span>
          )}
        </span>
        {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
      </button>

      <div className={`grid-filters-container ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Quick Date Shortcut Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Calendar size={13} />
            Quick Select:
          </span>
          <button
            type="button"
            className={`btn ${isTodaySelected ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', borderRadius: '20px' }}
            onClick={() => handleQuickDateSelect('today')}
          >
            Today
          </button>
          <button
            type="button"
            className={`btn ${isTomorrowSelected ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', borderRadius: '20px' }}
            onClick={() => handleQuickDateSelect('tomorrow')}
          >
            Tomorrow
          </button>
          <button
            type="button"
            className={`btn ${isWeekSelected ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', borderRadius: '20px' }}
            onClick={() => handleQuickDateSelect('thisWeek')}
          >
            Next 7 Days (Range)
          </button>
        </div>

        <div className="grid-filters">
          <div>
            <label className="label-text" htmlFor="search-input">Search</label>
            <div style={{ position: 'relative' }}>
              <input
                id="search-input"
                className="input-control"
                type="text"
                placeholder="Instructor or lab..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                style={{ paddingLeft: '2.25rem' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div>
            <label className="label-text" htmlFor="date-mode-select">Date Mode</label>
            <select
              id="date-mode-select"
              className="input-control"
              value={filters.dateMode}
              onChange={handleDateModeChange}
            >
              <option value="today">Today / Single Day</option>
              <option value="range">Date Range</option>
            </select>
          </div>

          {filters.dateMode === 'range' && (
            <>
              <div>
                <label className="label-text" htmlFor="from-date-input">From Date</label>
                <input
                  id="from-date-input"
                  className="input-control"
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="label-text" htmlFor="to-date-input">To Date</label>
                <input
                  id="to-date-input"
                  className="input-control"
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
                />
              </div>
            </>
          )}

          <div>
            <label className="label-text" htmlFor="track-select">Track</label>
            <select
              id="track-select"
              className="input-control"
              value={filters.track}
              onChange={(e) => setFilters(prev => ({ ...prev, track: e.target.value }))}
            >
              <option value="All">All Tracks</option>
              {tracks.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="label-text" htmlFor="instructor-select">Instructor</label>
            <select
              id="instructor-select"
              className="input-control"
              value={filters.instructor}
              onChange={(e) => setFilters(prev => ({ ...prev, instructor: e.target.value }))}
            >
              <option value="All">All Instructors</option>
              {instructors.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <div>
            <label className="label-text" htmlFor="lab-select">Lab</label>
            <select
              id="lab-select"
              className="input-control"
              value={filters.lab}
              onChange={(e) => setFilters(prev => ({ ...prev, lab: e.target.value }))}
            >
              <option value="All">All Labs</option>
              {labs.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.25rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.25rem' }}>
          <button type="button" className="btn btn-secondary" onClick={clearFilters}>
            <X size={16} />
            Clear Filters
          </button>
          <button type="button" className="btn btn-secondary" onClick={exportCsv}>
            <Download size={16} />
            Export CSV
          </button>
          <button type="button" className="btn btn-secondary" onClick={exportXlsx}>
            <Download size={16} />
            Export Excel
          </button>
          
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls"
              style={{ display: 'none' }}
            />
            <button type="button" className="btn btn-secondary" onClick={handleUploadClick}>
              <Upload size={16} />
              Upload Local Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
