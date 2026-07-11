import * as XLSX from 'xlsx';

const sheets = {
  'Data Analysis': '17omkSQuIBzvsFL6ygmVgybtA_byOhrCl',
  'Media Production': '11zulEER_JgMy8YHT3RVEHVIUET3MecgC',
  'INNOV/PROMPT': '1Ww6l4g5A9QTElH-QEI6XWUZ4N8g7W7yY',
  'Coaching': '1RbOVAhasXMrAMMtxzpfyUfoYSAjxeC1intzYEbEMP5I'
};

let instructorEmails = {
  'ahlam waleed': 'A7lam.waleed@gmail.com',
  'ahmed madeh': 'eng.a.madeh@gmail.com',
  'gehad waheed': 'gehadwaheed42@gmail.com',
  'haidy seada': 'Haidyraafatseada5@gmail.com',
  'hosam ashraf': 'hosh25006@gmail.com',
  'mahmoud ramadan': 'mahmoudex732@gmail.com',
  'mavie ahmed': 'mavieahmedkhattab@gmail.com',
  'mohamed azzam': 'devazzam001@gmail.com',
  'mohamed edriss': 'mohamedkhaledidris@gmail.com',
  'Ahlam Waleed': 'A7lam.waleed@gmail.com',
  'Ahmed madeh': 'eng.a.madeh@gmail.com',
  'Gehad Waheed': 'gehadwaheed42@gmail.com',
  'Haidy Seada': 'Haidyraafatseada5@gmail.com',
  'Hosam Ashraf': 'hosh25006@gmail.com',
  'Mahmoud Ramadan': 'mahmoudex732@gmail.com',
  'Mavie Ahmed': 'mavieahmedkhattab@gmail.com',
  'Mohamed Azzam': 'devazzam001@gmail.com',
  'Mohamed Edriss': 'mohamedkhaledidris@gmail.com',
  ...parseInstructorEmails(process.env.INSTRUCTOR_EMAILS_JSON || '{}')
};
const contactsSheetUrl = process.env.CONTACTS_SHEET_URL || '';
const sendGridApiKey = process.env.SENDGRID_API_KEY || '';
const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL || '';
const reminderDaysAhead = Number(process.env.REMINDER_DAYS_AHEAD || '1');
const dateMode = String(process.env.REMINDER_DATE_MODE || 'today').toLowerCase();
const reminderFromDate = process.env.REMINDER_FROM_DATE || '';
const reminderToDate = process.env.REMINDER_TO_DATE || '';
const dryRun = String(process.env.DRY_RUN || '').toLowerCase() === 'true';

function formatDateForInput(date) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10);
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function parseInstructorEmails(rawValue) {
  try {
    const parsed = JSON.parse(rawValue);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (error) {
    console.error('Failed to parse INSTRUCTOR_EMAILS_JSON:', error.message);
  }

  return {};
}

function normalizeHeader(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, ' ');
}

function sheetUrlToExportUrl(sheetUrl, format = 'csv') {
  if (!sheetUrl) return '';

  try {
    const parsed = new URL(sheetUrl);
    const match = parsed.pathname.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const sheetId = match ? match[1] : '';

    if (sheetId) {
      return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=${format}`;
    }
  } catch (error) {
    return sheetUrl;
  }

  return sheetUrl;
}

function parseContactsRows(rows) {
  if (!rows || rows.length === 0) return {};

  const headerRow = rows[0] || [];
  const normalizedHeaders = headerRow.map(normalizeHeader);
  const emailIndex = normalizedHeaders.findIndex(header => header.includes('email') || header.includes('mail'));
  const keyIndexCandidates = ['instructor', 'trainer', 'name', 'full name', 'number', 'id'];

  let keyIndex = keyIndexCandidates
    .map(candidate => normalizedHeaders.findIndex(header => header === candidate || header.includes(candidate)))
    .find(index => index >= 0);

  if (keyIndex === undefined || keyIndex < 0) {
    keyIndex = 0;
  }

  if (emailIndex < 0) {
    throw new Error('Contacts sheet must include an email column.');
  }

  const mappings = {};

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const key = String(row[keyIndex] || '').trim();
    const email = String(row[emailIndex] || '').trim();

    if (key && email) {
      mappings[key] = email;
      mappings[normalizeText(key)] = email;
    }
  }

  return mappings;
}

async function loadInstructorEmails() {
  if (!contactsSheetUrl) {
    return instructorEmails;
  }

  const exportUrl = sheetUrlToExportUrl(contactsSheetUrl, 'csv');
  const response = await fetch(exportUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch contacts sheet: ${response.status}`);
  }

  const csvText = await response.text();
  const workbook = XLSX.read(csvText, { type: 'string' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  instructorEmails = {
    ...instructorEmails,
    ...parseContactsRows(rows)
  };

  return instructorEmails;
}

function parseToSessions(rows, trackName = 'Local Upload') {
  if (!rows || rows.length < 5) return [];

  const sessions = [];
  const weekHeaders = rows[2] || [];
  const dayHeaders = rows[3] || [];
  const typeHeaders = rows[4] || [];

  const weekMap = {};
  const dayMap = {};
  let currentWeek = 'Week 1';
  let currentDay = 'Unknown Day';
  let maxCols = Math.max(weekHeaders.length, dayHeaders.length, typeHeaders.length);

  for (let c = 1; c < maxCols; c++) {
    if (weekHeaders[c] && typeof weekHeaders[c] === 'string' && weekHeaders[c].toLowerCase().includes('week')) {
      currentWeek = weekHeaders[c].trim();
    }
    if (dayHeaders[c] && String(dayHeaders[c]).trim() !== '') {
      currentDay = String(dayHeaders[c]).trim();
    }
    weekMap[c] = currentWeek;
    dayMap[c] = currentDay;
  }

  let currentCategory = 'General';
  let currentTrainer = 'Unknown';
  let lastLabByCol = {};

  for (let r = 5; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    if (row[0]) {
      let hasData = false;
      for (let c = 1; c < row.length; c++) {
        if (row[c]) {
          hasData = true;
          break;
        }
      }

      if (!hasData) {
        currentCategory = String(row[0]).trim();
        currentTrainer = 'Unknown';
        lastLabByCol = {};
      } else {
        currentTrainer = String(row[0]).trim();
        lastLabByCol = {};
      }
    }

    for (let c = 1; c < maxCols; c++) {
      if (typeHeaders[c] && String(typeHeaders[c]).toLowerCase().includes('time')) {
        let time = row[c];
        let labCol = c + 1;

        while (labCol < maxCols && (!typeHeaders[labCol] || !String(typeHeaders[labCol]).toLowerCase().includes('lab'))) {
          labCol++;
        }

        let lab = row[labCol];

        if (lab && String(lab).trim() !== '') {
          lab = String(lab).trim();
          lastLabByCol[labCol] = lab;
        } else {
          lab = lastLabByCol[labCol] || '-';
        }

        if (time && String(time).trim() !== '') {
          const timeStr = String(time).trim();
          if (/[0-9]{1,2}:[0-9]{2}\s*-\s*[0-9]{1,2}:[0-9]{2}/.test(timeStr)) {
            sessions.push({
              track: trackName,
              week: weekMap[c] || 'Unknown Week',
              day: dayMap[c] || 'Unknown Day',
              time: timeStr,
              lab,
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

function getScheduleWeekAndDay(dateStr) {
  if (!dateStr) return { week: null, day: null, formattedDate: null };
  const [year, month, day] = dateStr.split('-').map(Number);
  const current = new Date(year, month - 1, day);
  const refDate = new Date(2026, 6, 4);
  const diffTime = current - refDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weeksSince = Math.floor(diffDays / 7);
  const weekName = (weeksSince % 2 === 0) ? 'Week 2' : 'Week 1';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[current.getDay()];

  return {
    week: weekName,
    day: dayName,
    formattedDate: current.toLocaleDateString('en-GB')
  };
}

function getTargetDate(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return formatDateForInput(date);
}

function getTargetDates() {
  if (dateMode === 'range') {
    const fromDate = reminderFromDate || getTargetDate(reminderDaysAhead);
    const toDate = reminderToDate || fromDate;
    const start = fromDate <= toDate ? fromDate : toDate;
    const end = fromDate <= toDate ? toDate : fromDate;
    const dates = [];

    const current = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);

    while (current <= endDate) {
      dates.push(formatDateForInput(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  return [getTargetDate(reminderDaysAhead)];
}

function matchesSessionDate(session, targetDate) {
  const { week, day } = getScheduleWeekAndDay(targetDate);
  if (!week || !day || day === 'Thursday' || day === 'Friday') return false;

  const sheetWeekStr = String(session.week).toLowerCase().replace(/\s/g, '');
  const targetWeekStr = String(week).toLowerCase().replace(/\s/g, '');

  return sheetWeekStr === targetWeekStr && String(session.day).toLowerCase() === String(day).toLowerCase();
}

function groupByInstructor(sessions) {
  const grouped = new Map();

  for (const session of sessions) {
    const instructor = session.trainer || 'Unknown';
    if (!grouped.has(instructor)) grouped.set(instructor, []);
    grouped.get(instructor).push(session);
  }

  return [...grouped.entries()].map(([instructor, instructorSessions]) => ({
    instructor,
    email: instructorEmails[instructor] || instructorEmails[normalizeText(instructor)] || '',
    sessions: instructorSessions.sort((a, b) => a.time.localeCompare(b.time))
  }));
}

function buildEmailText(instructorName, sessions, targetDate) {
  const targetDateLabel = new Date(`${targetDate}T00:00:00`).toLocaleDateString('en-GB');
  const lines = sessions.map(session => `${session.time} | ${session.track} | ${session.lab} | ${session.category}`);
  return [
    `Hello ${instructorName},`,
    '',
    `This is an automatic reminder for your sessions on ${targetDateLabel}:`,
    '',
    ...lines,
    '',
    'Please make sure you come before the session',
    '',
    'Best regards,'
  ].join('\n');
}

async function fetchAllSessions() {
  const results = await Promise.all(Object.entries(sheets).map(async ([trackName, sheetId]) => {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${trackName}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    return parseToSessions(rows, trackName);
  }));

  return results.flat();
}

async function sendEmailWithSendGrid({ to, subject, text }) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sendGridApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }], subject }],
      from: { email: sendGridFromEmail },
      content: [{ type: 'text/plain', value: text }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid request failed for ${to}: ${response.status} ${errorText}`);
  }
}

async function main() {
  await loadInstructorEmails();

  const targetDates = getTargetDates();
  const targetDate = targetDates[0] || '';
  const allSessions = await fetchAllSessions();
  const targetSessions = allSessions.filter(session => targetDates.some(date => matchesSessionDate(session, date)));
  const groupedSessions = groupByInstructor(targetSessions);

  if (groupedSessions.length === 0) {
    console.log(`No instructor sessions found for ${targetDates.join(', ')}.`);
    return;
  }

  console.log(`Found ${groupedSessions.length} instructors with reminders for ${targetDates.join(', ')}.`);

  if (!sendGridApiKey || !sendGridFromEmail) {
    throw new Error('Missing SENDGRID_API_KEY or SENDGRID_FROM_EMAIL. Add them as GitHub Secrets.');
  }

  for (const group of groupedSessions) {
    if (!group.email) {
      console.log(`Skipping ${group.instructor}: no email mapping found. Add a matching name or number in the contacts sheet.`);
      continue;
    }

    const subject = `Reminder: Upcoming sessions for ${group.instructor}`;
    const text = buildEmailText(group.instructor, group.sessions, targetDate);

    if (dryRun) {
      console.log(`[DRY RUN] Would send to ${group.email} with ${group.sessions.length} session(s).`);
      continue;
    }

    await sendEmailWithSendGrid({
      to: group.email,
      subject,
      text
    });

    console.log(`Sent reminder to ${group.instructor} <${group.email}>`);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
