import React, { useState } from 'react';
import { UserCheck, X } from 'lucide-react';

export default function ReplaceInstructorModal({ session, instructors, onSave, onClose }) {
  const [selectedInstructor, setSelectedInstructor] = useState(session.trainer || 'Unknown');

  const handleSave = () => {
    onSave(session, selectedInstructor);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '450px', width: '90%' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={20} style={{ color: 'var(--accent-color)' }} />
            Replace Instructor
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ marginTop: '1rem' }}>
          <div style={{ padding: '0.85rem', backgroundColor: 'var(--scrollbar-track)', borderRadius: '8px', border: '1px solid var(--card-border)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            <p style={{ marginBottom: '0.35rem' }}><strong>Track:</strong> <span className="badge badge-track">{session.track}</span></p>
            <p style={{ marginBottom: '0.35rem' }}><strong>Date:</strong> {session.formattedDate} ({session.day})</p>
            <p style={{ marginBottom: '0.35rem' }}><strong>Time:</strong> {session.time}</p>
            <p style={{ marginBottom: '0.35rem' }}><strong>Lab:</strong> {session.lab}</p>
            <p><strong>Current Instructor:</strong> {session.originalTrainer || session.trainer}</p>
          </div>

          <div>
            <label className="label-text" htmlFor="replacement-select">Select Replacement Instructor</label>
            <select
              id="replacement-select"
              className="input-control"
              value={selectedInstructor}
              onChange={(e) => setSelectedInstructor(e.target.value)}
            >
              <option value="Unknown">Unknown</option>
              {instructors.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Save Replacement
          </button>
        </div>
      </div>
    </div>
  );
}
