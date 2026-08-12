import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import DashboardHeader from './components/DashboardHeader';
import KpiCards from './components/KpiCards';
import FilterPanel from './components/FilterPanel';
import ScheduleList from './components/ScheduleList';
import ReminderPanel from './components/ReminderPanel';
import VacationSwapPanel from './components/VacationSwapPanel';
import InteractiveCalendar from './components/InteractiveCalendar';
import EmailPreviewModal from './components/EmailPreviewModal';
import ReplaceInstructorModal from './components/ReplaceInstructorModal';

// Track Sheet IDs
const sheets = {
  'Data Analysis': '1P5Cxi9tzINtsVph8fFXMyVdayVj3i1Tx',
  'Media Production': '1tUOF04wcALeT-bucRy7Z3lPdcmsRkXzU'
};

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

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function getDeviceBrowserLabel() {
  const ua = navigator.userAgent || '';
  const platform = navigator.userAgentData?.platform || navigator.platform || '';

  const isIOS = /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isWindows = /Win/.test(platform) || /Windows/.test(ua);
  const isMac = /Mac/.test(platform) || /Mac OS X/.test(ua);
  const isLinux = /Linux/.test(platform) || /Linux/.test(ua);

  let device = 'Unknown device';
  if (isIOS) device = 'iPhone/iPad';
  else if (isAndroid) device = 'Android';
  else if (isWindows) device = 'Windows';
  else if (isMac) device = 'Mac';
  else if (isLinux) device = 'Linux';

  let browser = 'Browser';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/CriOS/i.test(ua) || (/Chrome/i.test(ua) && !/Edg|OPR|Opera/i.test(ua))) browser = 'Chrome';
  else if (/FxiOS/i.test(ua) || /Firefox/i.test(ua)) browser = 'Firefox';
  else if (/OPiOS|Opera/i.test(ua)) browser = 'Opera';
  else if (/Safari/i.test(ua) && !/Chrome|CriOS|Edg|OPR|Opera|FxiOS/i.test(ua)) browser = 'Safari';

  return `${browser} on ${device}`;
}

export default function App() {
  const [allSessions, setAllSessions] = useState([]);
  const [daysOff, setDaysOff] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('digilians_daysoff') || '[]');
    } catch {
      return [];
    }
  });
  const [swappedDays, setSwappedDays] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('digilians_swapped') || '[]');
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [whatsappSendLog, setWhatsappSendLog] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('digilians_whatsapp_log') || '[]');
    } catch {
      return [];
    }
  });

  // Toast notifications
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // Modals state
  const [activePreviewMessage, setActivePreviewMessage] = useState(null);
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

  // Sync daysOff and swappedDays to localStorage
  useEffect(() => {
    localStorage.setItem('digilians_daysoff', JSON.stringify(daysOff));
  }, [daysOff]);

  useEffect(() => {
    localStorage.setItem('digilians_swapped', JSON.stringify(swappedDays));
  }, [swappedDays]);

  useEffect(() => {
    localStorage.setItem('digilians_whatsapp_log', JSON.stringify(whatsappSendLog));
  }, [whatsappSendLog]);

  const handleAddDayOff = (newDayOff) => {
    setDaysOff(prev => [...prev, { ...newDayOff, id: Date.now().toString() }]);
    addToast(`Day off "${newDayOff.label || 'Day Off'}" added successfully`);
  };

  const handleDeleteDayOff = (id) => {
    setDaysOff(prev => prev.filter(d => d.id !== id));
    addToast('Day off removed', 'info');
  };

  const handleAddSwap = (date1, date2) => {
    if (!date1 || !date2 || date1 === date2) return;
    setSwappedDays(prev => {
      const exists = prev.some(s => s.date1 === date1 || s.date2 === date1 || s.date1 === date2 || s.date2 === date2);
      if (exists) {
        alert("One of these dates is already swapped. Remove the existing swap first.");
        return prev;
      }
      return [...prev, { id: Date.now().toString(), date1, date2 }];
    });
    addToast('Day swap created successfully');
  };

  const handleDeleteSwap = (id) => {
    setSwappedDays(prev => prev.filter(s => s.id !== id));
    addToast('Day swap removed', 'info');
  };

  const recordWhatsAppSend = (instructorName, sessions, source) => {
    const uniqueDates = [...new Set((sessions || []).map(session => session.dateStr).filter(Boolean))].sort();
    const dateLabels = uniqueDates.map(formatDateLabel);
    const dateRangeLabel = dateLabels.length > 1
      ? `${dateLabels[0]} - ${dateLabels[dateLabels.length - 1]}`
      : dateLabels[0] || 'No date';

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      instructorName,
      sessionCount: sessions?.length || 0,
      dateRangeLabel,
      sentAt: new Date().toISOString(),
      source,
      deviceLabel: getDeviceBrowserLabel()
    };

    setWhatsappSendLog(prev => [entry, ...prev].slice(0, 25));
    addToast(`Logged WhatsApp reminder for ${instructorName}`, 'info');
  };

  const handleSendWhatsApp = (instructorName, sessions, source = 'Reminder card') => {
    if (!buildWhatsAppText) return;
    const text = buildWhatsAppText(instructorName, sessions);
    recordWhatsAppSend(instructorName, sessions, source);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleScrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const clearWhatsAppLog = () => {
    setWhatsappSendLog([]);
    localStorage.removeItem('digilians_whatsapp_log');
    addToast('WhatsApp log cleared', 'info');
  };

  // Get full list of instructors across all loaded sessions
  const allInstructorsList = useMemo(() => {
    return [...new Set(allSessions.map(s => s.trainer))].filter(Boolean).sort();
  }, [allSessions]);

  // Retrieve sessions for any arbitrary date, respecting active filters
  const getSessionsForDate = React.useCallback((dStr) => {
    const isProjectDayOff = daysOff.some(doff => dStr >= doff.startDate && dStr <= doff.endDate);
    if (isProjectDayOff) return [];

    let resolvedDateStr = dStr;
    const swap = swappedDays.find(s => s.date1 === dStr || s.date2 === dStr);
    if (swap) {
      resolvedDateStr = (swap.date1 === dStr) ? swap.date2 : swap.date1;
    }

    const { week, day } = getScheduleWeekAndDay(resolvedDateStr);
    if (!week || !day) return [];

    const targetWeekStr = String(week).toLowerCase().replace(/\s/g, '');

    const list = [];
    for (const session of allSessions) {
      const sheetWeekStr = String(session.week).toLowerCase().replace(/\s/g, '');
      if (sheetWeekStr === targetWeekStr && String(session.day).toLowerCase() === String(day).toLowerCase()) {
        if (filters.track !== 'All' && session.track !== filters.track) continue;
        if (filters.instructor !== 'All' && session.trainer !== filters.instructor) continue;
        if (filters.lab !== 'All' && session.lab !== filters.lab) continue;
        if (filters.search) {
          const query = normalizeText(filters.search);
          const matchText = [session.track, session.trainer, session.lab, session.category, session.time]
            .map(normalizeText)
            .join(' ');
          if (!matchText.includes(query)) continue;
        }

        list.push(session);
      }
    }
    return list;
  }, [allSessions, daysOff, swappedDays, filters]);

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
    setIsBackgroundRefreshing(true);
    setRefreshKey(k => k + 1);
  }, []);

  // Fetch all schedules dynamically
  // Re-runs on mount and every 5 minutes (REFRESH_INTERVAL_MS), or when refreshKey changes
  const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    let active = true;

    async function loadData() {
      // On background refreshes, don't show the full-screen spinner
      if (allSessions.length === 0) setIsLoading(true);
      else setIsBackgroundRefreshing(true);
      setErrorMsg('');
      try {
        // Fetch schedules sheets in parallel
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
        if (active) {
          setIsLoading(false);
          setIsBackgroundRefreshing(false);
        }
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
    const list = [];

    for (const dStr of selectedDates) {
      // Check if this date is a project day off
      const isProjectDayOff = daysOff.some(doff => dStr >= doff.startDate && dStr <= doff.endDate);
      if (isProjectDayOff) continue;

      // Check if this date is swapped with another
      let resolvedDateStr = dStr;
      let swappedWithFormatted = null;
      const swap = swappedDays.find(s => s.date1 === dStr || s.date2 === dStr);
      if (swap) {
        resolvedDateStr = (swap.date1 === dStr) ? swap.date2 : swap.date1;
        const targetObj = getScheduleWeekAndDay(resolvedDateStr);
        swappedWithFormatted = targetObj.formattedDate;
      }

      const { week, day, formattedDate } = getScheduleWeekAndDay(resolvedDateStr);
      if (!week || !day) continue;

      const targetWeekStr = String(week).toLowerCase().replace(/\s/g, '');

      for (const session of allSessions) {
        const sheetWeekStr = String(session.week).toLowerCase().replace(/\s/g, '');

        if (sheetWeekStr === targetWeekStr && String(session.day).toLowerCase() === String(day).toLowerCase()) {
          // Track filter
          if (filters.track !== 'All' && session.track !== filters.track) continue;

          // Instructor filter
          if (filters.instructor !== 'All' && session.trainer !== filters.instructor) continue;

          // Lab filter
          if (filters.lab !== 'All' && session.lab !== filters.lab) continue;

          // Search text filter
          if (filters.search) {
            const query = normalizeText(filters.search);
            const matchText = [session.track, session.trainer, session.lab, session.category, session.time]
              .map(normalizeText)
              .join(' ');
            if (!matchText.includes(query)) continue;
          }

          // Create a new occurrence object to prevent mutating allSessions directly
          // and allow projecting onto multiple dates in a long range
          list.push({
            ...session,
            dateStr: dStr,
            formattedDate: getScheduleWeekAndDay(dStr).formattedDate,
            swappedWith: swappedWithFormatted
          });
        }
      }
    }

    return list;
  }, [allSessions, selectedDates, filters, swappedDays, daysOff]);

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
          session.category === sessionToUpdate.category &&
          session.trainer === sessionToUpdate.trainer
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
    addToast(`Instructor replaced with ${newInstructorName}`);
  };

  const buildWhatsAppText = (instructorName, sessions) => {
    // Group sessions by date for better readability
    const dateGroups = new Map();
    sessions.forEach(session => {
      const key = session.formattedDate || session.dateStr;
      if (!dateGroups.has(key)) dateGroups.set(key, { day: session.day, sessions: [] });
      dateGroups.get(key).sessions.push(session);
    });

    let text = `السلام عليكم يا *${instructorName}* 👋\n\n`;
    text += `📋 *تذكير بالسيشنز القادمة:*\n`;
    text += `━━━━━━━━━━━━━━━\n\n`;

    [...dateGroups.entries()].forEach(([date, { day, sessions: daySessions }]) => {
      text += `📅 *${date} (${day})*\n`;
      daySessions.forEach(s => {
        text += `   🕐 ${s.time}\n`;
        text += `   📚 ${s.track} | 🏢 ${s.lab}\n`;
        if (s.category) text += `   🏷️ ${s.category}\n`;
        text += `\n`;
      });
    });

    text += `━━━━━━━━━━━━━━━\n`;
    text += `⚠️ *برجاء الحضور قبل الميعاد بوقت كافي*\n\n`;
    text += `شكراً ليك 🙏`;
    return text;
  };

  const handlePreviewWhatsAppClick = (instructorName, sessions) => {
    const whatsappBody = buildWhatsAppText(instructorName, sessions);
    setActivePreviewMessage({
      instructorName,
      sessions,
      whatsappBody
    });
  };

  const handleSendWhatsAppFromPreview = () => {
    if (!activePreviewMessage) return;
    handleSendWhatsApp(activePreviewMessage.instructorName, activePreviewMessage.sessions, 'Preview modal');
  };

  return (
    <div className="app-container">
      {isBackgroundRefreshing && (
        <div className="refresh-bar">
          <div className="refresh-bar-inner" />
        </div>
      )}

      <DashboardHeader
        isDark={isDark}
        toggleTheme={toggleTheme}
        lastUpdated={lastUpdated}
        onRefresh={refreshData}
        isRefreshing={isLoading || isBackgroundRefreshing}
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
            <KpiCards occurrences={occurrences} />

          <section id="filters-section">
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
          </section>

          <section id="calendar-section">
            <InteractiveCalendar
              filters={filters}
              setFilters={setFilters}
              daysOff={daysOff}
              onAddDayOff={handleAddDayOff}
              onDeleteDayOff={handleDeleteDayOff}
              swappedDays={swappedDays}
              onAddSwap={handleAddSwap}
              onDeleteSwap={handleDeleteSwap}
              getSessionsForDate={getSessionsForDate}
              getScheduleWeekAndDay={getScheduleWeekAndDay}
            />
          </section>

          <div className="card" style={{ padding: '0.75rem 1.25rem', marginBottom: '1.5rem', backgroundColor: 'var(--accent-light)', borderColor: 'var(--accent-color)', color: 'var(--accent-color)', fontWeight: 700, borderRadius: '12px' }}>
            {selectedDates.length === 1 ? (
              <span>📅 Showing schedule for {new Date(selectedDates[0] + 'T00:00:00').toLocaleDateString('en-GB')}</span>
            ) : (
              <span>📅 Showing schedule from {new Date(selectedDates[0] + 'T00:00:00').toLocaleDateString('en-GB')} to {new Date(selectedDates[selectedDates.length - 1] + 'T00:00:00').toLocaleDateString('en-GB')}</span>
            )}
          </div>

          <div className="grid-content">
            <section id="schedule-section">
              <ScheduleList
                selectedDates={selectedDates}
                getScheduleWeekAndDay={getScheduleWeekAndDay}
                occurrences={occurrences}
                onEditSession={setActiveEditSession}
                swappedDays={swappedDays}
              />
            </section>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <section id="reminders-section">
                <ReminderPanel
                  occurrences={occurrences}
                  onPreviewWhatsApp={handlePreviewWhatsAppClick}
                  onSendWhatsApp={handleSendWhatsApp}
                  onEditSession={setActiveEditSession}
                  buildWhatsAppText={buildWhatsAppText}
                />
              </section>

              <VacationSwapPanel
                daysOff={daysOff}
                onAddDayOff={handleAddDayOff}
                onDeleteDayOff={handleDeleteDayOff}
                swappedDays={swappedDays}
                onAddSwap={handleAddSwap}
                onDeleteSwap={handleDeleteSwap}
              />

              <section id="whatsapp-log-section" className="card whatsapp-log-card">
                <div className="whatsapp-log-header">
                  <div>
                    <h2>WhatsApp Send Log</h2>
                    <p>Recent sends from this browser or device.</p>
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={clearWhatsAppLog} disabled={whatsappSendLog.length === 0}>
                    Clear Log
                  </button>
                </div>

                {whatsappSendLog.length === 0 ? (
                  <p className="placeholder-text" style={{ padding: '1.5rem 1rem', marginBottom: 0 }}>
                    No WhatsApp reminders have been sent yet.
                  </p>
                ) : (
                  <div className="whatsapp-log-list">
                    {whatsappSendLog.map(entry => {
                      const sentAt = new Date(entry.sentAt);
                      const sentDate = sentAt.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      });
                      const sentTime = sentAt.toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <div key={entry.id} className="whatsapp-log-item">
                          <div className="whatsapp-log-item-top">
                            <strong>{entry.instructorName}</strong>
                            <span>{entry.sessionCount} session{entry.sessionCount === 1 ? '' : 's'}</span>
                          </div>
                          <div className="whatsapp-log-item-meta">
                            <span>Sent {sentDate} at {sentTime}</span>
                            <span>{entry.source}</span>
                            <span>{entry.deviceLabel}</span>
                          </div>
                          <div className="whatsapp-log-item-range">{entry.dateRangeLabel}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </div>

          {activePreviewMessage && (
            <EmailPreviewModal
              emailData={activePreviewMessage}
              onSendWhatsApp={handleSendWhatsAppFromPreview}
              onClose={() => setActivePreviewMessage(null)}
            />
          )}

          {activeEditSession && (
            <ReplaceInstructorModal
              session={activeEditSession}
              instructors={allInstructorsList}
              onSave={handleReplaceInstructor}
              onClose={() => setActiveEditSession(null)}
            />
          )}

          {/* Toast Notifications */}
          <div className="toast-container">
            {toasts.map(toast => (
              <div key={toast.id} className={`toast toast-${toast.type}`}>
                {toast.type === 'success' ? '✅' : 'ℹ️'} {toast.message}
              </div>
            ))}
          </div>

          <nav className="mobile-quick-actions" aria-label="Quick actions">
            <button type="button" className="mobile-quick-action-btn" onClick={() => handleScrollToSection('filters-section')}>
              Filters
            </button>
            <button type="button" className="mobile-quick-action-btn" onClick={() => handleScrollToSection('calendar-section')}>
              Calendar
            </button>
            <button type="button" className="mobile-quick-action-btn" onClick={() => handleScrollToSection('reminders-section')}>
              Reminders
            </button>
            <button type="button" className="mobile-quick-action-btn" onClick={() => handleScrollToSection('whatsapp-log-section')}>
              Send Log
            </button>
          </nav>
        </>
      )}
    </div>
  );
}
