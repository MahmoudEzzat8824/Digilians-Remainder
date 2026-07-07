import React, { useRef } from 'react';
import { Search, X, Download, Upload } from 'lucide-react';

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

  const handleDateModeChange = (e) => {
    const mode = e.target.value;
    const today = new Date().toISOString().slice(0, 10);
    setFilters(prev => ({
      ...prev,
      dateMode: mode,
      fromDate: today,
      toDate: today
    }));
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="card filters-section">
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
            <option value="today">Today Only</option>
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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.25rem' }}>
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
        
        <div style={{ marginLeft: 'auto' }}>
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
  );
}
