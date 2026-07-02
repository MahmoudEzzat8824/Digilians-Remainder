document.addEventListener('DOMContentLoaded', () => {
    const uploadInput = document.getElementById('upload-excel');
    const tableContainer = document.getElementById('table-container');

    // Document IDs mapped from your shared links
    const sheets = {
        'btn-data-analysis': '17omkSQuIBzvsFL6ygmVgybtA_byOhrCl',
        'btn-media-production': '11zulEER_JgMy8YHT3RVEHVIUET3MecgC',
        'btn-innov-prompt': '1Ww6l4g5A9QTElH-QEI6XWUZ4N8g7W7yY',
        'btn-coaching': '1RbOVAhasXMrAMMtxzpfyUfoYSAjxeC1intzYEbEMP5I'
    };

    // Helper to dynamically remove empty bounds from the worksheet before rendering
    function trimWorksheet(ws) {
        if (!ws || !ws['!ref']) return;
        const range = XLSX.utils.decode_range(ws['!ref']);
        let maxRow = range.s.r, maxCol = range.s.c;
        
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell = ws[XLSX.utils.encode_cell({r: R, c: C})];
                if (cell && cell.v !== undefined && cell.v !== null && String(cell.v).trim() !== "") {
                    if (R > maxRow) maxRow = R;
                    if (C > maxCol) maxCol = C;
                }
            }
        }
        
        // Ensure merges don't get cut off
        if (ws['!merges']) {
            ws['!merges'].forEach(merge => {
                if (merge.s.r <= maxRow && merge.s.c <= maxCol) {
                    if (merge.e.r > maxRow) maxRow = merge.e.r;
                    if (merge.e.c > maxCol) maxCol = merge.e.c;
                }
            });
        }
        
        ws['!ref'] = XLSX.utils.encode_range({
            s: {r: range.s.r, c: range.s.c},
            e: {r: maxRow, c: maxCol}
        });
    }

    // Helper to render the table using SheetJS
    function renderExcelData(dataBuffer) {
        try {
            const data = new Uint8Array(dataBuffer);
            const workbook = XLSX.read(data, {type: 'array'});
            
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Trim empty trailing rows and columns
            trimWorksheet(worksheet);
            
            let htmlString = XLSX.utils.sheet_to_html(worksheet);
            
            // Inject our styling classes into the generated table
            htmlString = htmlString.replace('<table', '<table class="schedule-table"');
            
            // Post-process table to dynamically color cells based on content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlString;
            const cells = tempDiv.querySelectorAll('td, th');
            
            const colorMap = {};
            const pastelColors = ['#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff', '#e6b3ff', '#ffb3e6', '#c4faf8', '#f2c6de', '#fce2c4'];
            let colorIndex = 0;

            cells.forEach(cell => {
                const text = cell.textContent.trim();
                if (!text) return;
                
                // Color Logic based on text content
                if (text.match(/LAB/i)) {
                    cell.style.backgroundColor = '#baffc9'; // light green
                    cell.style.fontWeight = 'bold';
                } else if (text.match(/^M[1-9]/i) || text.toLowerCase() === 'model') {
                    cell.style.backgroundColor = '#bae1ff'; // light blue
                } else if (text.match(/^[0-9]{1,2}:[0-9]{2}/)) {
                    cell.style.backgroundColor = '#ffffba'; // light yellow
                } else if (text.length > 2) {
                    // Assign consistent distinct color to Trainers and Headers
                    if (!colorMap[text]) {
                        colorMap[text] = pastelColors[colorIndex % pastelColors.length];
                        colorIndex++;
                    }
                    cell.style.backgroundColor = colorMap[text];
                    cell.style.fontWeight = 'bold';
                    cell.style.color = '#333';
                }
            });
            
            tableContainer.innerHTML = tempDiv.innerHTML;
        } catch (error) {
            console.error("Error parsing Excel data:", error);
            tableContainer.innerHTML = '<p style="text-align: center; color: red; font-weight: bold;">Error parsing file. Please ensure it is a valid Excel document.</p>';
        }
    }

    // Attach click events to the Google Sheet buttons
    Object.keys(sheets).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if(!btn) return;

        btn.addEventListener('click', async () => {
            const sheetId = sheets[btnId];
            tableContainer.innerHTML = '<p style="text-align: center; font-weight: bold; color: #5b9bd5;">Fetching live data from Google Sheets...</p>';
            
            // Disable all buttons during the fetch
            const allBtns = document.querySelectorAll('.btn');
            allBtns.forEach(b => b.disabled = true);
            
            try {
                // Fetch the sheet as an xlsx export natively supported by Google Docs
                const url = "https://docs.google.com/spreadsheets/d/" + sheetId + "/export?format=xlsx";
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                
                const arrayBuffer = await response.arrayBuffer();
                renderExcelData(arrayBuffer);
            } catch (error) {
                console.error("Fetch error:", error);
                tableContainer.innerHTML = '<p style="text-align: center; color: red; font-weight: bold;">Failed to fetch the schedule. Please ensure you have internet access and the link is active.</p>';
            } finally {
                // Re-enable buttons once done
                allBtns.forEach(b => b.disabled = false);
            }
        });
    });

    // Local file upload handling
    if(uploadInput) {
        uploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            tableContainer.innerHTML = '<p style="text-align: center; font-weight: bold; color: #5b9bd5;">Processing local Excel file...</p>';

            const reader = new FileReader();
            reader.onload = function(e) {
                renderExcelData(e.target.result);
            };
            reader.readAsArrayBuffer(file);
        });
    }
});
