import React from 'react';
import { BookOpen, Users, Layers } from 'lucide-react';

export default function KpiCards({ occurrences }) {
  const totalSessions = occurrences.length;
  
  const activeTracks = [...new Set(occurrences.map(s => s.track))].filter(Boolean).length;
  
  const instructors = [...new Set(occurrences.map(s => s.trainer))].filter(Boolean);
  const totalInstructors = instructors.length;

  return (
    <div className="grid-kpi">
      <div className="card kpi-card">
        <div className="kpi-icon-wrapper">
          <BookOpen size={22} />
        </div>
        <div>
          <div className="kpi-title">Total Sessions</div>
          <div className="kpi-value">{totalSessions}</div>
        </div>
      </div>

      <div className="card kpi-card">
        <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
          <Layers size={22} />
        </div>
        <div>
          <div className="kpi-title">Active Tracks</div>
          <div className="kpi-value">{activeTracks}</div>
        </div>
      </div>

      <div className="card kpi-card">
        <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
          <Users size={22} />
        </div>
        <div>
          <div className="kpi-title">Total Instructors</div>
          <div className="kpi-value">{totalInstructors}</div>
        </div>
      </div>

    </div>
  );
}
