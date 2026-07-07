import React from 'react';
import { Sun, Moon, Calendar } from 'lucide-react';

export default function DashboardHeader({ isDark, toggleTheme }) {
  const formattedDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
      <div>
        <h1>Live Training Schedules</h1>
        <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem', fontWeight: 500 }}>
          <Calendar size={16} />
          {formattedDate}
        </p>
      </div>
      <button
        onClick={toggleTheme}
        className="btn btn-secondary"
        style={{ width: '42px', height: '42px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDark ? <Sun size={20} style={{ color: '#fbbf24' }} /> : <Moon size={20} />}
      </button>
    </header>
  );
}
