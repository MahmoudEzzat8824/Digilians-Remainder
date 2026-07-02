document.addEventListener('DOMContentLoaded', () => {
    const uploadInput = document.getElementById('upload-excel');
    const scheduleContainer = document.getElementById('schedule-container');
    const filtersSection = document.getElementById('filters-section');
    
    const filterTrack = document.getElementById('filter-track');
    const filterWeek = document.getElementById('filter-week');
    const filterDay = document.getElementById('filter-day');

    let allSessions = [];

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

    function updateFilterOptions() {
        const tracks = [...new Set(allSessions.map(s => s.track))].filter(Boolean);
        const weeks = [...new Set(allSessions.map(s => s.week))].filter(Boolean);
        
        const dayOrder = { "Saturday":1, "Sunday":2, "Monday":3, "Tuesday":4, "Wednesday":5, "Thursday":6, "Friday":7 };
        const days = [...new Set(allSessions.map(s => s.day))].filter(Boolean).sort((a,b) => (dayOrder[a]||99) - (dayOrder[b]||99));

        if(filterTrack) {
            filterTrack.innerHTML = '<option value="All">All Tracks</option>';
            tracks.forEach(t => { filterTrack.innerHTML += `<option value="${t}">${t}</option>`; });
        }

        if(filterWeek) {
            filterWeek.innerHTML = '<option value="All">All Weeks</option>';
            weeks.forEach(w => { filterWeek.innerHTML += `<option value="${w}">${w}</option>`; });
        }

        if(filterDay) {
            filterDay.innerHTML = '<option value="All">All Days</option>';
            days.forEach(d => { filterDay.innerHTML += `<option value="${d}">${d}</option>`; });
        }
        
        filtersSection.style.display = 'block';
    }

    function renderGroupedSchedule() {
        const selectedTrack = filterTrack ? filterTrack.value : 'All';
        const selectedWeek = filterWeek ? filterWeek.value : 'All';
        const selectedDay = filterDay ? filterDay.value : 'All';

        let filtered = allSessions.filter(s => {
            return (selectedTrack === 'All' || s.track === selectedTrack) &&
                   (selectedWeek === 'All' || s.week === selectedWeek) &&
                   (selectedDay === 'All' || s.day === selectedDay);
        });

        if (filtered.length === 0) {
            scheduleContainer.innerHTML = '<p class="placeholder">No sessions found for the selected filters.</p>';
            return;
        }

        // Group by Week, then Day
        const grouped = {};
        filtered.forEach(s => {
            if (!grouped[s.week]) grouped[s.week] = {};
            if (!grouped[s.week][s.day]) grouped[s.week][s.day] = [];
            grouped[s.week][s.day].push(s);
        });

        let html = '';
        for (const week in grouped) {
            html += `<div class="week-group"><h2 class="week-title">${week}</h2>`;
            for (const day in grouped[week]) {
                html += `<div class="day-group"><h3 class="day-title">${day}</h3>`;
                
                // Render as a responsive table instead of cards
                html += `
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
                
                grouped[week][day].forEach(session => {
                    html += `
                        <tr>
                            <td class="time-col">🕒 ${session.time}</td>
                            <td><span class="track-badge">${session.track}</span></td>
                            <td><strong>${session.trainer}</strong></td>
                            <td>${session.category}</td>
                            <td>${session.lab}</td>
                        </tr>
                    `;
                });
                
                html += `
                        </tbody>
                    </table>
                </div></div>
                `;
            }
            html += `</div>`;
        }

        scheduleContainer.innerHTML = html;
    }

    if(filterTrack) filterTrack.addEventListener('change', renderGroupedSchedule);
    if(filterWeek) filterWeek.addEventListener('change', renderGroupedSchedule);
    if(filterDay) filterDay.addEventListener('change', renderGroupedSchedule);

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
            
            updateFilterOptions();
            renderGroupedSchedule();
            
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
                    updateFilterOptions();
                    renderGroupedSchedule();
                } catch(err) {
                    scheduleContainer.innerHTML = '<p class="placeholder" style="color: red;">Error processing local file.</p>';
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }
});
