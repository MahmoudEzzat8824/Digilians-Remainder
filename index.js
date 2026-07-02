document.addEventListener('DOMContentLoaded', () => {
    const uploadInput = document.getElementById('upload-excel');
    const scheduleContainer = document.getElementById('schedule-container');
    const filtersSection = document.getElementById('filters-section');
    const filterWeek = document.getElementById('filter-week');
    const filterDay = document.getElementById('filter-day');

    let allSessions = [];

    // Document IDs mapped from your shared links
    const sheets = {
        'btn-data-analysis': '17omkSQuIBzvsFL6ygmVgybtA_byOhrCl',
        'btn-media-production': '11zulEER_JgMy8YHT3RVEHVIUET3MecgC',
        'btn-innov-prompt': '1Ww6l4g5A9QTElH-QEI6XWUZ4N8g7W7yY',
        'btn-coaching': '1RbOVAhasXMrAMMtxzpfyUfoYSAjxeC1intzYEbEMP5I'
    };

    // Advanced Parser: Converts the pivoted Excel visual table into a structured JSON array of sessions
    function parseToSessions(rows) {
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

        // Pass 1: Dynamically map every column index to its corresponding Week and Day
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
                } else {
                    currentTrainer = String(row[0]).trim();
                }
            }
            
            // Pass 3: Extract time and lab pairs horizontally
            for (let c = 1; c < row.length; c++) {
                if (typeHeaders[c] && String(typeHeaders[c]).toLowerCase().includes("time")) {
                    let time = row[c];
                    
                    // Look ahead for the corresponding Lab column
                    let labCol = c + 1;
                    while (labCol < row.length && (!typeHeaders[labCol] || !String(typeHeaders[labCol]).toLowerCase().includes("lab"))) {
                        labCol++;
                    }
                    
                    let lab = row[labCol];
                    
                    if (time && lab && String(time).trim() !== "") {
                        sessions.push({
                            week: weekMap[c] || "Unknown Week",
                            day: dayMap[c] || "Unknown Day",
                            time: String(time).trim(),
                            lab: String(lab).trim(),
                            trainer: currentTrainer,
                            category: currentCategory
                        });
                    }
                }
            }
        }
        return sessions;
    }

    // Populate the dropdown filters based on exactly what exists in the parsed data
    function updateFilterOptions() {
        // Extract unique, sorted weeks and days
        const weeks = [...new Set(allSessions.map(s => s.week))].filter(Boolean);
        // Standard sort for days
        const dayOrder = { "Saturday":1, "Sunday":2, "Monday":3, "Tuesday":4, "Wednesday":5, "Thursday":6, "Friday":7 };
        const days = [...new Set(allSessions.map(s => s.day))].filter(Boolean).sort((a,b) => (dayOrder[a]||99) - (dayOrder[b]||99));

        filterWeek.innerHTML = '<option value="All">All Weeks</option>';
        weeks.forEach(w => {
            filterWeek.innerHTML += \`<option value="\${w}">\${w}</option>\`;
        });

        filterDay.innerHTML = '<option value="All">All Days</option>';
        days.forEach(d => {
            filterDay.innerHTML += \`<option value="\${d}">\${d}</option>\`;
        });
        
        // Show the filter bar
        filtersSection.style.display = 'block';
    }

    // Main render engine: filters and groups data into Cards
    function renderGroupedSchedule() {
        const selectedWeek = filterWeek.value;
        const selectedDay = filterDay.value;

        // Apply filters
        let filtered = allSessions.filter(s => {
            return (selectedWeek === 'All' || s.week === selectedWeek) &&
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
            html += \`<div class="week-group"><h2 class="week-title">\${week}</h2>\`;
            for (const day in grouped[week]) {
                html += \`<div class="day-group"><h3 class="day-title">\${day}</h3>\`;
                html += \`<div class="session-cards">\`;
                
                grouped[week][day].forEach(session => {
                    html += \`
                        <div class="session-card">
                            <div class="time-badge">🕒 \${session.time}</div>
                            <div class="session-detail"><strong>Category:</strong> \${session.category}</div>
                            <div class="session-detail"><strong>Instructor:</strong> \${session.trainer}</div>
                            <div class="session-detail"><strong>Lab:</strong> \${session.lab}</div>
                        </div>
                    \`;
                });
                
                html += \`</div></div>\`;
            }
            html += \`</div>\`;
        }

        scheduleContainer.innerHTML = html;
    }

    // Attach listeners to dropdowns
    filterWeek.addEventListener('change', renderGroupedSchedule);
    filterDay.addEventListener('change', renderGroupedSchedule);

    function renderExcelData(dataBuffer) {
        try {
            const data = new Uint8Array(dataBuffer);
            const workbook = XLSX.read(data, {type: 'array'});
            
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convert to a raw 2D array matrix
            const rows = XLSX.utils.sheet_to_json(worksheet, {header: 1});
            
            // Run the advanced parser
            allSessions = parseToSessions(rows);
            
            if (allSessions.length === 0) {
                scheduleContainer.innerHTML = '<p class="placeholder" style="color: red;">Could not find structured session data inside this sheet.</p>';
                return;
            }
            
            // Setup filters and perform initial render
            updateFilterOptions();
            renderGroupedSchedule();
            
        } catch (error) {
            console.error("Error parsing Excel data:", error);
            scheduleContainer.innerHTML = '<p class="placeholder" style="color: red;">Error parsing file. Please ensure it is a valid schedule document.</p>';
        }
    }

    // Attach click events to the Google Sheet fetch buttons
    Object.keys(sheets).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if(!btn) return;

        btn.addEventListener('click', async () => {
            const sheetId = sheets[btnId];
            scheduleContainer.innerHTML = '<p class="placeholder" style="color: #5b9bd5;">Fetching live data from Google Sheets...</p>';
            filtersSection.style.display = 'none'; // hide filters while loading
            
            const allBtns = document.querySelectorAll('.btn');
            allBtns.forEach(b => b.disabled = true);
            
            try {
                const url = "https://docs.google.com/spreadsheets/d/" + sheetId + "/export?format=xlsx";
                const response = await fetch(url);
                if (!response.ok) throw new Error("Network response was not ok");
                
                const arrayBuffer = await response.arrayBuffer();
                renderExcelData(arrayBuffer);
            } catch (error) {
                scheduleContainer.innerHTML = '<p class="placeholder" style="color: red;">Failed to fetch the schedule. Ensure the link is active.</p>';
            } finally {
                allBtns.forEach(b => b.disabled = false);
            }
        });
    });

    // Local file upload handling fallback
    if(uploadInput) {
        uploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            scheduleContainer.innerHTML = '<p class="placeholder" style="color: #5b9bd5;">Processing local Excel file...</p>';
            filtersSection.style.display = 'none';

            const reader = new FileReader();
            reader.onload = function(e) {
                renderExcelData(e.target.result);
            };
            reader.readAsArrayBuffer(file);
        });
    }
});
