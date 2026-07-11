import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import DashboardHeader from './components/DashboardHeader';
import KpiCards from './components/KpiCards';
import FilterPanel from './components/FilterPanel';
import ScheduleList from './components/ScheduleList';
import ReminderPanel from './components/ReminderPanel';
import EmailPreviewModal from './components/EmailPreviewModal';
import ReplaceInstructorModal from './components/ReplaceInstructorModal';

// Track Sheet IDs
const sheets = {
  'Coaching': '1Bius1WfZY3TZN0lIKgq95lAR9WnZyCBiCg7M6CAy4k0',
  'Data Analysis': '1P5Cxi9tzINtsVph8fFXMyVdayVj3i1Tx',
  'Media Production': '1tUOF04wcALeT-bucRy7Z3lPdcmsRkXzU',
  'Innov/Prompt': '1FwJLcM0bPU62q38jMhlh6AfR-8UpNeL3'
};

const contactsSheetId = '1zIYPqJZN-6uv6L9tAmDro_g1zC2f9IreHu9aOHlIrCQ';

// Helper date utilities
function formatDateForInput(date) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10);
}

function getTodayValue() {
  return formatDateForInput(new Date());
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeHeader(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, ' ');
}

// Week projection logic starting from reference Saturday, July 4, 2026
function getScheduleWeekAndDay(dateStr) {
  if (!dateStr) return { week: null, day: null, formattedDate: null };
  const [year, month, day] = dateStr.split('-').map(Number);
  const current = new Date(year, month - 1, day);
  const refDate = new Date(2026, 6, 4); // July 4, 2026
  const diffTime = current - refDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weeksSince = Math.floor(diffDays / 7);
  const weekName = (weeksSince % 2 === 0) ? 'Week 2' : 'Week 1';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return {
    week: weekName,
    day: days[current.getDay()],
    formattedDate: current.toLocaleDateString('en-GB')
  };
}

function getDatesInRange(fromDateStr, toDateStr) {
  if (!fromDateStr || !toDateStr) return [];
  const start = new Date(fromDateStr + 'T00:00:00');
  const end = new Date(toDateStr + 'T00:00:00');
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];

  const normalizedStart = start <= end ? start : end;
  const normalizedEnd = start <= end ? end : start;
  const dates = [];

  const current = new Date(normalizedStart);
  while (current <= normalizedEnd) {
    dates.push(formatDateForInput(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export default function App() {
  const [allSessions, setAllSessions] = useState([]);
  const [instructorEmailMap, setInstructorEmailMap] = useState({
    'Ahlam Waleed': 'A7lam.waleed@gmail.com',
    'Ahmed madeh': 'eng.a.madeh@gmail.com',
    'Gehad Waheed': 'gehadwaheed42@gmail.com',
    'Haidy Seada': 'Haidyraafatseada5@gmail.com',
    'Hosam Ashraf': 'hosh25006@gmail.com',
    'Mahmoud Ramadan': 'mahmoudex732@gmail.com',
    'Mavie Ahmed': 'mavieahmedkhattab@gmail.com',
    'Mohamed Azzam': 'devazzam001@gmail.com',
    'Mohamed Edriss': 'mohamedkhaledidris@gmail.com'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Modals state
  const [activePreviewEmail, setActivePreviewEmail] = useState(null);
  const [activeEditSession, setActiveEditSession] = useState(null);

  // Theme State
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark') ||
      localStorage.getItem('theme') === 'dark';
  });

  // Filters State
  const [filters, setFilters] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      track: params.get('track') || 'All',
      instructor: params.get('instructor') || 'All',
      lab: params.get('lab') || 'All',
      search: params.get('search') || '',
      dateMode: params.get('mode') || 'today',
      fromDate: params.get('from') || getTodayValue(),
      toDate: params.get('to') || getTodayValue()
    };
  });

  // Apply dark class on theme load/toggle
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  // Sync filters to URL Search parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.track && filters.track !== 'All') params.set('track', filters.track);
    if (filters.instructor && filters.instructor !== 'All') params.set('instructor', filters.instructor);
    if (filters.lab && filters.lab !== 'All') params.set('lab', filters.lab);
    if (filters.search) params.set('search', filters.search);
    if (filters.dateMode !== 'today') params.set('mode', filters.dateMode);
    if (filters.fromDate && filters.fromDate !== getTodayValue()) params.set('from', filters.fromDate);
    if (filters.toDate && filters.toDate !== getTodayValue()) params.set('to', filters.toDate);

    const queryString = params.toString();
    const newUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [filters]);

  // Dynamic lookup function for instructor emails
  const getInstructorEmail = React.useCallback((name) => {
    if (!name) return '';
    const normalized = normalizeText(name);
    for (const [key, email] of Object.entries(instructorEmailMap)) {
      if (normalizeText(key) === normalized) {
        return email;
      }
    }
    return '';
  }, [instructorEmailMap]);

  // Parser helper function for schedules
  const parseToSessions = (rows, trackName = "Local Upload") => {
    if (!rows || rows.length < 5) return [];

    const sessions = [];
    const weekHeaders = rows[2] || [];
    const dayHeaders = rows[3] || [];
    const typeHeaders = rows[4] || [];

    const weekMap = {};
    const dayMap = {};
    let currentWeek = "Week 1";
    let currentDay = "Unknown Day";
    let maxCols = Math.max(weekHeaders.length, dayHeaders.length, typeHeaders.length);

    for (let c = 1; c < maxCols; c++) {
      if (weekHeaders[c] && typeof weekHeaders[c] === 'string' && weekHeaders[c].toLowerCase().includes('week')) {
        currentWeek = weekHeaders[c].trim();
      }
      if (dayHeaders[c] && String(dayHeaders[c]).trim() !== "") {
        currentDay = String(dayHeaders[c]).trim();
      }
      weekMap[c] = currentWeek;
      dayMap[c] = currentDay;
    }

    let currentCategory = "General";
    let currentTrainer = "Unknown";
    let lastLabByCol = {};

    for (let r = 5; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      if (row[0]) {
        let hasData = false;
        for (let c = 1; c < row.length; c++) {
          if (row[c]) { hasData = true; break; }
        }
        if (!hasData) {
          currentCategory = String(row[0]).trim();
          currentTrainer = "Unknown";
          lastLabByCol = {};
        } else {
          currentTrainer = String(row[0]).trim();
          lastLabByCol = {};
        }
      }

      for (let c = 1; c < maxCols; c++) {
        if (typeHeaders[c] && String(typeHeaders[c]).toLowerCase().includes("time")) {
          let time = row[c];
          let labCol = c + 1;
          while (labCol < maxCols && (!typeHeaders[labCol] || !String(typeHeaders[labCol]).toLowerCase().includes("lab"))) {
            labCol++;
          }

          let lab = row[labCol];

          if (lab && String(lab).trim() !== "") {
            lab = String(lab).trim();
            lastLabByCol[labCol] = lab;
          } else {
            lab = lastLabByCol[labCol] || "-";
          }

          if (time && String(time).trim() !== "") {
            let timeStr = String(time).trim();
            if (/[0-9]{1,2}:[0-9]{2}\s*-\s*[0-9]{1,2}:[0-9]{2}/.test(timeStr)) {
              sessions.push({
                track: trackName,
                week: weekMap[c] || "Unknown Week",
                day: dayMap[c] || "Unknown Day",
                time: timeStr,
                lab: lab,
                trainer: currentTrainer,
                category: currentCategory
              });
            }
          }
        }
      }
    }
    return sessions;
  };

  // Manual refresh trigger
  const refreshData = React.useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  // Fetch all schedules and trainer emails dynamically
  // Re-runs on mount and every 5 minutes (REFRESH_INTERVAL_MS), or when refreshKey changes
  const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    let active = true;

    async function loadData() {
      // On background refreshes, don't show the full-screen spinner
      if (allSessions.length === 0) setIsLoading(true);
      setErrorMsg('');
      try {
        // 1. Fetch trainer emails from Google Sheet first
        const emailsMap = { ...instructorEmailMap };
        try {
          const emailUrl = `https://docs.google.com/spreadsheets/d/${contactsSheetId}/export?format=csv`;
          const emailRes = await fetch(emailUrl);
          if (emailRes.ok) {
            const csvText = await emailRes.text();
            const workbook = XLSX.read(csvText, { type: 'string' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (rows && rows.length > 0) {
              const headerRow = rows[0] || [];
              const normalizedHeaders = headerRow.map(normalizeHeader);
              const emailIndex = normalizedHeaders.findIndex(h => h.includes('email') || h.includes('mail'));
              const keyIndexCandidates = ['instructor', 'trainer', 'name', 'full name', 'number', 'id'];

              let keyIndex = keyIndexCandidates
                .map(candidate => normalizedHeaders.findIndex(h => h === candidate || h.includes(candidate)))
                .find(index => index >= 0);

              if (keyIndex === undefined || keyIndex < 0) keyIndex = 0;

              if (emailIndex >= 0) {
                for (let r = 1; r < rows.length; r++) {
                  const row = rows[r] || [];
                  const nameKey = String(row[keyIndex] || '').trim();
                  const emailVal = String(row[emailIndex] || '').trim();
                  if (nameKey && emailVal) {
                    emailsMap[nameKey] = emailVal;
                    emailsMap[normalizeText(nameKey)] = emailVal;
                  }
                }
              }
            }
          }
        } catch (emailErr) {
          console.error("Failed to load trainer emails from Google Sheet, falling back to defaults:", emailErr);
        }

        if (!active) return;
        setInstructorEmailMap(emailsMap);

        // 2. Fetch schedules sheets in parallel
        const fetchPromises = Object.entries(sheets).map(async ([trackName, sheetId]) => {
          const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to fetch sheet for track: ${trackName}`);

          const arrayBuffer = await res.arrayBuffer();
          const data = new Uint8Array(arrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          return parseToSessions(rows, trackName);
        });

        const results = await Promise.all(fetchPromises);
        if (!active) return;

        const mergedSessions = results.flat();
        setAllSessions(mergedSessions);
        setLastUpdated(new Date());

        if (mergedSessions.length === 0) {
          setErrorMsg("Could not parse schedule session data.");
        }
      } catch (err) {
        console.error(err);
        if (active) {
          setErrorMsg("Failed to fetch schedules. Please check your internet connection and sheet access.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadData();

    // Schedule periodic background refresh
    const intervalId = setInterval(() => {
      if (active) loadData();
    }, REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [refreshKey]); // refreshKey re-mounts the effect on manual refresh

  // Compute selected dates based on range/today mode
  const selectedDates = useMemo(() => {
    if (filters.dateMode === 'today') {
      return [filters.fromDate || getTodayValue()];
    }
    return getDatesInRange(filters.fromDate, filters.toDate);
  }, [filters.dateMode, filters.fromDate, filters.toDate]);

  // Compute occurrences (filtered sessions)
  const occurrences = useMemo(() => {
    const datesSet = new Set(selectedDates);

    return allSessions.filter(session => {
      // Find matching dates for this session's week and day
      let matchesDate = false;
      let targetDateStr = null;
      let targetFormattedDate = null;

      for (const dStr of selectedDates) {
        const { week, day, formattedDate } = getScheduleWeekAndDay(dStr);
        if (!week || !day) continue;

        const sheetWeekStr = String(session.week).toLowerCase().replace(/\s/g, '');
        const targetWeekStr = String(week).toLowerCase().replace(/\s/g, '');

        if (sheetWeekStr === targetWeekStr && String(session.day).toLowerCase() === String(day).toLowerCase()) {
          matchesDate = true;
          targetDateStr = dStr;
          targetFormattedDate = formattedDate;
          break; // Matches the first matching date in the selection
        }
      }

      if (!matchesDate) return false;

      // Track filter
      if (filters.track !== 'All' && session.track !== filters.track) return false;

      // Instructor filter
      if (filters.instructor !== 'All' && session.trainer !== filters.instructor) return false;

      // Lab filter
      if (filters.lab !== 'All' && session.lab !== filters.lab) return false;

      // Search text filter
      if (filters.search) {
        const query = normalizeText(filters.search);
        const matchText = [session.track, session.trainer, session.lab, session.category, session.time]
          .map(normalizeText)
          .join(' ');
        if (!matchText.includes(query)) return false;
      }

      // Populate occurrence details
      session.dateStr = targetDateStr;
      session.formattedDate = targetFormattedDate;

      return true;
    });
  }, [allSessions, selectedDates, filters]);

  // Compute dynamic lists for dropdown selectors
  const filterOptions = useMemo(() => {
    // Dropdowns are dynamically computed from currently visible/available options to prevent empty selections
    // Let's first get matches without specific filter constraints to populate the drop lists
    const tracksList = [...new Set(allSessions.map(s => s.track))].filter(Boolean);

    // For instructors and labs, base them on current dates selection
    const rawInstructors = [];
    const rawLabs = [];

    allSessions.forEach(session => {
      let matchesDate = false;
      for (const dStr of selectedDates) {
        const { week, day } = getScheduleWeekAndDay(dStr);
        const sheetWeekStr = String(session.week).toLowerCase().replace(/\s/g, '');
        const targetWeekStr = String(week).toLowerCase().replace(/\s/g, '');
        if (sheetWeekStr === targetWeekStr && String(session.day).toLowerCase() === String(day).toLowerCase()) {
          matchesDate = true;
          break;
        }
      }

      if (matchesDate) {
        if (session.trainer) rawInstructors.push(session.trainer);
        if (session.lab) rawLabs.push(session.lab);
      }
    });

    return {
      tracks: tracksList.sort((a, b) => a.localeCompare(b)),
      instructors: [...new Set(rawInstructors)].sort((a, b) => a.localeCompare(b)),
      labs: [...new Set(rawLabs)].sort((a, b) => a.localeCompare(b))
    };
  }, [allSessions, selectedDates]);

  // Handle local excel file upload fallback
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMsg('');
    setAllSessions([]);

    const reader = new FileReader();
    reader.onload = function (evt) {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const sessions = parseToSessions(rows, "Local Upload");
        setAllSessions(sessions);
        setFilters(prev => ({
          ...prev,
          track: 'All',
          instructor: 'All',
          lab: 'All',
          search: '',
          fromDate: getTodayValue(),
          toDate: getTodayValue()
        }));
      } catch (err) {
        console.error(err);
        setErrorMsg("Error parsing uploaded Excel file.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const clearFilters = () => {
    const todayVal = getTodayValue();
    setFilters({
      track: 'All',
      instructor: 'All',
      lab: 'All',
      search: '',
      dateMode: 'today',
      fromDate: todayVal,
      toDate: todayVal
    });
  };

  // Export filtered sessions
  const exportCsv = () => {
    if (occurrences.length === 0) return;
    const rows = occurrences.map(occ => ({
      Date: occ.formattedDate,
      Week: occ.week,
      Day: occ.day,
      Time: occ.time,
      Track: occ.track,
      Instructor: occ.trainer,
      Category: occ.category,
      Lab: occ.lab
    }));

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(r => headers.map(h => `"${String(r[h]).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'digilians-schedule.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportXlsx = () => {
    if (occurrences.length === 0) return;
    const rows = occurrences.map(occ => ({
      Date: occ.formattedDate,
      Week: occ.week,
      Day: occ.day,
      Time: occ.time,
      Track: occ.track,
      Instructor: occ.trainer,
      Category: occ.category,
      Lab: occ.lab
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Schedule');
    XLSX.writeFile(workbook, 'digilians-schedule.xlsx');
  };

  const handleReplaceInstructor = (sessionToUpdate, newInstructorName) => {
    setAllSessions(prevSessions => {
      return prevSessions.map(session => {
        if (
          session.day === sessionToUpdate.day &&
          session.week === sessionToUpdate.week &&
          session.time === sessionToUpdate.time &&
          session.track === sessionToUpdate.track &&
          session.lab === sessionToUpdate.lab &&
          session.category === sessionToUpdate.category
        ) {
          return {
            ...session,
            originalTrainer: session.originalTrainer || session.trainer,
            trainer: newInstructorName
          };
        }
        return session;
      });
    });
    setActiveEditSession(null);
  };

  const buildEmailText = (instructorName, sessions) => {
    const lines = sessions.map(session => {
      return `${session.formattedDate} (${session.day}) - ${session.time} | ${session.track} | ${session.lab} | ${session.category}`;
    });
    const intro = `Hello ${instructorName},\n\nThis is a reminder of your upcoming sessions:\n\n`;
    const outro = `\n\nplease make sure you come before the session by a good time\n\nBest regards,`;
    return intro + lines.join('\n') + outro;
  };

  const handleComposeEmailClick = (instructorName, sessions, emailAddress) => {
    const subject = `Reminder: Upcoming sessions for ${instructorName}`;
    const body = buildEmailText(instructorName, sessions);
    setActivePreviewEmail({
      instructorName,
      to: emailAddress || '',
      subject,
      body
    });
  };

  return (
    <div className="app-container">
      <DashboardHeader
        isDark={isDark}
        toggleTheme={toggleTheme}
        lastUpdated={lastUpdated}
        onRefresh={refreshData}
        isRefreshing={isLoading}
      />

      {isLoading ? (
        <div className="card spinner-container">
          <div className="spinner"></div>
          <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Loading live schedules... Please wait.</p>
        </div>
      ) : errorMsg ? (
        <div className="card" style={{ borderLeft: '4px solid var(--danger-color)', padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--danger-color)', marginBottom: '0.5rem' }}>Failed to Load</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>{errorMsg}</p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
            <div>
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".xlsx, .xls"
                style={{ display: 'none' }}
                id="retry-upload"
              />
              <label htmlFor="retry-upload" className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                Upload Local File
              </label>
            </div>
          </div>
        </div>
      ) : (
        <>
          <KpiCards occurrences={occurrences} instructorEmailMap={instructorEmailMap} />

          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            tracks={filterOptions.tracks}
            instructors={filterOptions.instructors}
            labs={filterOptions.labs}
            clearFilters={clearFilters}
            exportCsv={exportCsv}
            exportXlsx={exportXlsx}
            handleFileUpload={handleFileUpload}
          />

          <div className="card" style={{ padding: '0.75rem 1.25rem', marginBottom: '1.5rem', backgroundColor: 'var(--accent-light)', borderColor: 'var(--accent-color)', color: 'var(--accent-color)', fontWeight: 700, borderRadius: '12px' }}>
            {selectedDates.length === 1 ? (
              <span>📅 Showing schedule for {new Date(selectedDates[0] + 'T00:00:00').toLocaleDateString('en-GB')}</span>
            ) : (
              <span>📅 Showing schedule from {new Date(selectedDates[0] + 'T00:00:00').toLocaleDateString('en-GB')} to {new Date(selectedDates[selectedDates.length - 1] + 'T00:00:00').toLocaleDateString('en-GB')}</span>
            )}
          </div>

          <div className="grid-content">
            <ScheduleList
              selectedDates={selectedDates}
              getScheduleWeekAndDay={getScheduleWeekAndDay}
              occurrences={occurrences}
              onEditSession={setActiveEditSession}
            />

            <ReminderPanel
              occurrences={occurrences}
              instructorEmailMap={instructorEmailMap}
              getInstructorEmail={getInstructorEmail}
              onComposeEmail={handleComposeEmailClick}
              onEditSession={setActiveEditSession}
            />
          </div>
          
          {activePreviewEmail && (
            <EmailPreviewModal
              emailData={activePreviewEmail}
              onClose={() => setActivePreviewEmail(null)}
            />
          )}

          {activeEditSession && (
            <ReplaceInstructorModal
              session={activeEditSession}
              instructors={filterOptions.instructors}
              onSave={handleReplaceInstructor}
              onClose={() => setActiveEditSession(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
