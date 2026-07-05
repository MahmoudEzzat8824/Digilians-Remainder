document.addEventListener('DOMContentLoaded', () => {
    const uploadInput = document.getElementById('upload-excel');
    const scheduleContainer = document.getElementById('schedule-container');
    const filtersSection = document.getElementById('filters-section');
    
    const filterInstructor = document.getElementById('filter-instructor');
    const filterLab = document.getElementById('filter-lab');
    const filterTrack = document.getElementById('filter-track');
    const filterSearch = document.getElementById('filter-search');
    const filterDateFrom = document.getElementById('filter-date-from');
    const filterDateTo = document.getElementById('filter-date-to');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const exportXlsxBtn = document.getElementById('export-xlsx-btn');
    const activeDateDisplay = document.getElementById('active-date-display');
    const summarySection = document.getElementById('summary-section');
    const summaryBody = document.getElementById('summary-body');
    const resultsCount = document.getElementById('results-count');

    let allSessions = [];

    function formatDateForInput(date) {
        const tzOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10);
    }

    function setDefaultDateRange() {
        const today = new Date();
        const todayValue = formatDateForInput(today);

        if (filterDateFrom) filterDateFrom.value = todayValue;
        if (filterDateTo) filterDateTo.value = todayValue;
    }

    function getTodayValue() {
        return formatDateForInput(new Date());
    }

    function normalizeText(value) {
        return String(value || '').trim().toLowerCase();
    }

    function getActiveFilters() {
        return {
            track: filterTrack ? filterTrack.value : 'All',
            instructor: filterInstructor ? filterInstructor.value : 'All',
            lab: filterLab ? filterLab.value : 'All',
            search: filterSearch ? filterSearch.value.trim() : '',
            fromDate: filterDateFrom ? filterDateFrom.value : null,
            toDate: filterDateTo ? filterDateTo.value : null
        };
    }

    function buildUrlFromFilters(filters) {
        const params = new URLSearchParams();
        if (filters.track && filters.track !== 'All') params.set('track', filters.track);
        if (filters.instructor && filters.instructor !== 'All') params.set('instructor', filters.instructor);
        if (filters.lab && filters.lab !== 'All') params.set('lab', filters.lab);
        if (filters.search) params.set('search', filters.search);
        if (filters.fromDate) params.set('from', filters.fromDate);
        if (filters.toDate) params.set('to', filters.toDate);
        return params.toString();
    }

    function syncUrlWithFilters() {
        const filters = getActiveFilters();
        const queryString = buildUrlFromFilters(filters);
        const newUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}`;
        window.history.replaceState({}, '', newUrl);
    }

    function getFiltersFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return {
            track: params.get('track') || 'All',
            instructor: params.get('instructor') || 'All',
            lab: params.get('lab') || 'All',
            search: params.get('search') || '',
            fromDate: params.get('from') || getTodayValue(),
            toDate: params.get('to') || getTodayValue()
        };
    }

    function applyFilters(filters) {
        if (filterTrack) filterTrack.value = filters.track || 'All';
        if (filterInstructor) filterInstructor.value = filters.instructor || 'All';
        if (filterLab) filterLab.value = filters.lab || 'All';
        if (filterSearch) filterSearch.value = filters.search || '';
        if (filterDateFrom) filterDateFrom.value = filters.fromDate || getTodayValue();
        if (filterDateTo) filterDateTo.value = filters.toDate || getTodayValue();
    }

    function resetFilters() {
        applyFilters({
            track: 'All',
            instructor: 'All',
            lab: 'All',
            search: '',
            fromDate: getTodayValue(),
            toDate: getTodayValue()
        });
        refreshFiltersAndSchedule();
    }

    // Set Date inputs to today's date in local time initially
    if (filterDateFrom || filterDateTo) {
        setDefaultDateRange();
    }

    // Document IDs mapped from your shared links
    const sheets = {
        'Data Analysis': '17omkSQuIBzvsFL6ygmVgybtA_byOhrCl',
        'Media Production': '11zulEER_JgMy8YHT3RVEHVIUET3MecgC',
        'INNOV/PROMPT': '1Ww6l4g5A9QTElH-QEI6XWUZ4N8g7W7yY',
        'Coaching': '1RbOVAhasXMrAMMtxzpfyUfoYSAjxeC1intzYEbEMP5I'
    };

    function parseToSessions(rows, trackName = "Local Upload") {
        if (!rows || rows.length < 5) return [];

        let sessions = [];
        const weekHeaders = rows[2] || [];
        const dayHeaders = rows[3] || [];
        const typeHeaders = rows[4] || []; 

        let weekMap = {};
        let currentWeek = "Week 1";
        
        let dayMap = {};
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

        // Pass 2: Iterate vertically through the trainers/categories
        for (let r = 5; r < rows.length; r++) {
            const row = rows[r];
            if (!row || row.length === 0) continue;
            
            // If column 0 is populated, detect if it's a Category header or a Trainer name
            if (row[0]) {
                let hasData = false;
                for (let c = 1; c < row.length; c++) {
                    if (row[c]) { hasData = true; break; }
                }
                // Categories usually have no horizontal schedule data in the same row
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
                        // Only add valid time blocks (e.g. 9:00 - 11:00)
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
    }

    function sessionMatchesSearch(session, searchText) {
        if (!searchText) return true;
        const searchableText = [session.track, session.trainer, session.lab, session.category, session.time]
            .map(normalizeText)
            .join(' ');
        return searchableText.includes(normalizeText(searchText));
    }

    function getScheduleOccurrences(overrideFilters = {}) {
        const filters = { ...getActiveFilters(), ...overrideFilters };
        const selectedDates = getDatesInRange(filters.fromDate, filters.toDate);

        if (selectedDates.length === 0) {
            return [];
        }

        const occurrences = [];

        selectedDates.forEach(dateStr => {
            const { week, day, formattedDate } = getScheduleWeekAndDay(dateStr);
            if (!week || !day || day === 'Thursday' || day === 'Friday') return;

            allSessions.forEach(session => {
                const sheetWeekStr = String(session.week).toLowerCase().replace(/\s/g, '');
                const targetWeekStr = String(week).toLowerCase().replace(/\s/g, '');

                if ((filters.track === 'All' || session.track === filters.track) &&
                    (filters.instructor === 'All' || session.trainer === filters.instructor) &&
                    (filters.lab === 'All' || session.lab === filters.lab) &&
                    sheetWeekStr === targetWeekStr &&
                    String(session.day).toLowerCase() === String(day).toLowerCase() &&
                    sessionMatchesSearch(session, filters.search)) {
                    occurrences.push({
                        dateStr,
                        formattedDate,
                        week,
                        day,
                        ...session
                    });
                }
            });
        });

        return occurrences;
    }

    function updateFilterOptions() {
        const currentFilters = getActiveFilters();
        const tracks = [...new Set(allSessions.map(s => s.track))].filter(Boolean);
        const instructors = [...new Set(getScheduleOccurrences({ instructor: 'All' }).map(s => s.trainer).filter(Boolean))].sort((a, b) => a.localeCompare(b));
        const labs = [...new Set(getScheduleOccurrences({ lab: 'All' }).map(s => s.lab).filter(Boolean))].sort((a, b) => a.localeCompare(b));
        
        if(filterTrack) {
            filterTrack.innerHTML = '<option value="All">All Tracks</option>';
            tracks.forEach(t => { filterTrack.innerHTML += `<option value="${t}">${t}</option>`; });
            filterTrack.value = currentFilters.track;
        }

        if (filterInstructor) {
            filterInstructor.innerHTML = '<option value="All">All Instructors</option>';
            instructors.forEach(name => {
                filterInstructor.innerHTML += `<option value="${name}">${name}</option>`;
            });
            filterInstructor.value = instructors.includes(currentFilters.instructor) ? currentFilters.instructor : 'All';
        }

        if (filterLab) {
            filterLab.innerHTML = '<option value="All">All Labs</option>';
            labs.forEach(name => {
                filterLab.innerHTML += `<option value="${name}">${name}</option>`;
            });
            filterLab.value = labs.includes(currentFilters.lab) ? currentFilters.lab : 'All';
        }
        
        filtersSection.style.display = 'block';
    }

    function refreshFiltersAndSchedule() {
        updateFilterOptions();
        renderGroupedSchedule();
        syncUrlWithFilters();
    }

    function parseDateInput(dateStr) {
        if (!dateStr) return null;
        const parsed = new Date(dateStr + 'T00:00:00');
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    function getDatesInRange(fromDateStr, toDateStr) {
        const fromDate = parseDateInput(fromDateStr);
        const toDate = parseDateInput(toDateStr);
        if (!fromDate && !toDate) return [];

        const start = fromDate || toDate;
        const end = toDate || fromDate;
        if (!start || !end) return [];

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


    // Advanced mathematical logic to project infinite repetitive weeks starting from July 4, 2026
    function getScheduleWeekAndDay(dateStr) {
        if (!dateStr) return { week: null, day: null, formattedDate: null };
        const [year, month, day] = dateStr.split('-').map(Number);
        
        // Month in Date object is 0-indexed
        const current = new Date(year, month - 1, day);
        
        // Pivot/Reference date: July 4, 2026 (Saturday) -> Which marks the start of Week 2
        const refDate = new Date(2026, 6, 4); 
        
        // Difference in days between selected date and reference date
        const diffTime = current - refDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        // Calculate weeks elapsed since the pivot
        let weeksSince = Math.floor(diffDays / 7);
        
        // Alternating logic: Even weeks are Week 2, Odd weeks are Week 1
        const weekName = (weeksSince % 2 === 0) ? "Week 2" : "Week 1";
        
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayName = days[current.getDay()];
        
        return { 
            week: weekName, 
            day: dayName, 
            formattedDate: current.toLocaleDateString('en-GB') 
        };
    }

    function renderGroupedSchedule() {
        const filters = getActiveFilters();
        const selectedDates = getDatesInRange(filters.fromDate, filters.toDate);
        if (selectedDates.length === 0) return;

        const occurrences = getScheduleOccurrences();
        const rangeStart = selectedDates[0];
        const rangeEnd = selectedDates[selectedDates.length - 1];

        if (activeDateDisplay) {
            activeDateDisplay.innerHTML = rangeStart === rangeEnd
                ? `📅 Showing schedule for ${new Date(rangeStart + 'T00:00:00').toLocaleDateString('en-GB')}`
                : `📅 Showing schedule from ${new Date(rangeStart + 'T00:00:00').toLocaleDateString('en-GB')} to ${new Date(rangeEnd + 'T00:00:00').toLocaleDateString('en-GB')}`;
        }

        if (resultsCount) {
            resultsCount.textContent = `${occurrences.length} session${occurrences.length === 1 ? '' : 's'}`;
        }

        if (summarySection && summaryBody) {
            const uniqueDays = [...new Set(selectedDates.map(dateStr => getScheduleWeekAndDay(dateStr).day).filter(Boolean))];
            const uniqueWeeks = [...new Set(selectedDates.map(dateStr => getScheduleWeekAndDay(dateStr).week).filter(Boolean))];
            const appliedSearch = filters.search ? filters.search : 'None';
            summaryBody.innerHTML = `
                <div class="summary-grid">
                    <div class="summary-chip">Range: ${new Date(rangeStart + 'T00:00:00').toLocaleDateString('en-GB')} - ${new Date(rangeEnd + 'T00:00:00').toLocaleDateString('en-GB')}</div>
                    <div class="summary-chip">Weeks: ${uniqueWeeks.join(', ') || 'None'}</div>
                    <div class="summary-chip">Days: ${uniqueDays.join(', ') || 'None'}</div>
                    <div class="summary-chip">Track: ${filters.track}</div>
                    <div class="summary-chip">Instructor: ${filters.instructor}</div>
                    <div class="summary-chip">Lab: ${filters.lab}</div>
                    <div class="summary-chip">Search: ${appliedSearch}</div>
                </div>
            `;
            summarySection.style.display = 'block';
        }

        const daySections = [];

        selectedDates.forEach(dateStr => {
            const { week, day, formattedDate } = getScheduleWeekAndDay(dateStr);
            if (!week || !day) return;

            if (day === "Thursday" || day === "Friday") {
                daySections.push(`
                    <div class="day-group">
                        <h3 class="day-title">${formattedDate} - ${day}</h3>
                        <p class="placeholder" style="color: #27ae60; font-size: 18px; font-weight: bold;">Take a rest! It's the weekend. 🎉</p>
                    </div>
                `);
                return;
            }

            let filtered = occurrences.filter(occurrence => occurrence.dateStr === dateStr);

            if (filtered.length === 0) {
                daySections.push(`
                    <div class="day-group">
                        <h3 class="day-title">${formattedDate} - ${day}</h3>
                        <p class="placeholder">No matching sessions for this date and selected filters.</p>
                    </div>
                `);
                return;
            }

            filtered.sort((a, b) => {
                const timeA = parseInt(a.time.split(':')[0]) || 0;
                const timeB = parseInt(b.time.split(':')[0]) || 0;
                return timeA - timeB;
            });

            let tableHtml = `
                <div class="day-group">
                    <h3 class="day-title">${formattedDate} - ${day}</h3>
                    <div style="overflow-x: auto;">
                        <table class="session-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Track</th>
                                    <th>Instructor</th>
                                    <th>Category</th>
                                    <th>Lab</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            filtered.forEach(session => {
                tableHtml += `
                    <tr>
                        <td class="time-col">🕒 ${session.time}</td>
                        <td><span class="track-badge badge-track">${session.track}</span></td>
                        <td><span class="instructor-badge">${session.trainer}</span></td>
                        <td>${session.category}</td>
                        <td><span class="lab-badge">${session.lab}</span></td>
                    </tr>
                `;
            });

            tableHtml += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            daySections.push(tableHtml);
        });

        if (daySections.length === 0) {
            const hasSearch = Boolean(filters.search);
            scheduleContainer.innerHTML = `<p class="placeholder">${hasSearch ? 'No sessions matched the selected filters and search term.' : 'No sessions found for the selected date range and filters.'}</p>`;
            return;
        }
        scheduleContainer.innerHTML = daySections.join('');
    }

    function exportFilteredSessions(format) {
        const occurrences = getScheduleOccurrences();
        if (occurrences.length === 0) return;

        const rows = occurrences.map(occurrence => ({
            Date: occurrence.formattedDate,
            Week: occurrence.week,
            Day: occurrence.day,
            Time: occurrence.time,
            Track: occurrence.track,
            Instructor: occurrence.trainer,
            Category: occurrence.category,
            Lab: occurrence.lab
        }));

        if (format === 'csv') {
            const headers = Object.keys(rows[0]);
            const csvRows = [headers.join(',')];
            rows.forEach(row => {
                csvRows.push(headers.map(header => `"${String(row[header]).replace(/"/g, '""')}"`).join(','));
            });

            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'digilians-schedule.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            return;
        }

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Schedule');
        XLSX.writeFile(workbook, 'digilians-schedule.xlsx');
    }

    if(filterTrack) filterTrack.addEventListener('change', refreshFiltersAndSchedule);
    if(filterInstructor) filterInstructor.addEventListener('change', refreshFiltersAndSchedule);
    if(filterLab) filterLab.addEventListener('change', refreshFiltersAndSchedule);
    if(filterSearch) filterSearch.addEventListener('input', refreshFiltersAndSchedule);
    if(filterDateFrom) filterDateFrom.addEventListener('change', refreshFiltersAndSchedule);
    if(filterDateTo) filterDateTo.addEventListener('change', refreshFiltersAndSchedule);
    if(clearFiltersBtn) clearFiltersBtn.addEventListener('click', resetFilters);
    if(exportCsvBtn) exportCsvBtn.addEventListener('click', () => exportFilteredSessions('csv'));
    if(exportXlsxBtn) exportXlsxBtn.addEventListener('click', () => exportFilteredSessions('xlsx'));

    // Auto-fetch all data concurrently on page load
    async function fetchAllSchedules() {
        try {
            const fetchPromises = Object.entries(sheets).map(async ([trackName, sheetId]) => {
                const url = "https://docs.google.com/spreadsheets/d/" + sheetId + "/export?format=xlsx";
                const response = await fetch(url);
                if (!response.ok) throw new Error("Failed to fetch " + trackName);
                
                const arrayBuffer = await response.arrayBuffer();
                const data = new Uint8Array(arrayBuffer);
                const workbook = XLSX.read(data, {type: 'array'});
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(worksheet, {header: 1});
                
                return parseToSessions(rows, trackName);
            });
            
            const results = await Promise.all(fetchPromises);
            
            results.forEach(sessions => {
                allSessions = allSessions.concat(sessions);
            });
            
            if (allSessions.length === 0) {
                scheduleContainer.innerHTML = '<p class="placeholder" style="color: red;">Could not find structured session data.</p>';
                return;
            }
            
            applyFilters(getFiltersFromUrl());
            refreshFiltersAndSchedule();
            
        } catch (error) {
            console.error(error);
            scheduleContainer.innerHTML = '<p class="placeholder" style="color: red;">Failed to fetch the schedules. Please ensure you have internet access and the links are active.</p>';
        }
    }

    // Execute the fetch immediately on load
    fetchAllSchedules();

    // Local file upload handling fallback
    if(uploadInput) {
        uploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            scheduleContainer.innerHTML = '<p class="placeholder" style="color: #5b9bd5;">Processing local Excel file...</p>';
            filtersSection.style.display = 'none';
            allSessions = [];

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, {type: 'array'});
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json(worksheet, {header: 1});
                    
                    allSessions = parseToSessions(rows, "Local Upload");
                    applyFilters({
                        track: 'All',
                        instructor: 'All',
                        lab: 'All',
                        search: '',
                        fromDate: getTodayValue(),
                        toDate: getTodayValue()
                    });
                    refreshFiltersAndSchedule();
                } catch(err) {
                    scheduleContainer.innerHTML = '<p class="placeholder" style="color: red;">Error processing local file.</p>';
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }
});
