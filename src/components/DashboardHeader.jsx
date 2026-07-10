import React from 'react';
import { Sun, Moon, Calendar, RefreshCw, Wifi } from 'lucide-react';

export default function DashboardHeader({ isDark, toggleTheme, lastUpdated, onRefresh, isRefreshing }) {
  const formattedDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const lastUpdatedLabel = lastUpdated
    ? `Synced at ${lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
    : 'Syncing…';

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
      <div>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Live Training Schedules
          {/* Live indicator dot */}
          <span title="Auto-refreshes every 5 minutes" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em',
            backgroundColor: 'var(--success-bg, #d1fae5)', color: 'var(--success-color, #059669)',
            padding: '2px 8px', borderRadius: '999px', verticalAlign: 'middle',
            border: '1px solid var(--success-color, #059669)'
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              backgroundColor: 'var(--success-color, #059669)',
              animation: 'pulse-dot 2s ease-in-out infinite'
            }} />
            LIVE
          </span>
        </h1>
        <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem', fontWeight: 500, flexWrap: 'wrap' }}>
          <Calendar size={16} />
          {formattedDate}
          <span style={{ opacity: 0.5 }}>·</span>
          <Wifi size={14} />
          <span style={{ fontSize: '0.8rem' }}>{lastUpdatedLabel}</span>
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {/* Manual Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
          title="Refresh data from Google Sheets now"
          id="manual-refresh-btn"
        >
          <RefreshCw
            size={15}
            style={{
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
              transition: 'opacity 0.2s'
            }}
          />
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-secondary"
          style={{ width: '42px', height: '42px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          id="theme-toggle-btn"
        >
          {isDark ? <Sun size={20} style={{ color: '#fbbf24' }} /> : <Moon size={20} />}
        </button>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
}
