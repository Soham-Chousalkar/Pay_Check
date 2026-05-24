/**
 * Format time as HH:MM
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time
 */
export function formatTimeOnly(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${hh}:${mi}`;
}

/**
 * Format date as YYYY-MM-DD
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted date
 */
export function formatDateOnly(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Format date and time as YYYY-MM-DD HH:MM
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted date and time
 */
export function formatDateTime(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

/**
 * Parse a date string
 * @param {string} val - Date string to parse
 * @returns {number|null} Milliseconds or null if invalid
 */
export function parseDateTime(val) {
  const ms = Date.parse(val.replace(" ", "T"));
  return isNaN(ms) ? null : ms;
}

/**
 * Parse a user-friendly date/time string
 * @param {string} val - Date/time string to parse
 * @param {number} baseMs - Base time for relative inputs
 * @returns {number|null} Milliseconds or null if invalid
 */
export function parseUserDateTime(val, baseMs) {
  if (!val || !val.trim()) return null;
  const s = val.trim().toLowerCase();
  // Contains date part
  if (/\d{4}-\d{2}-\d{2}/.test(s)) {
    const iso = s.replace(/\s+/, 'T');
    const t = Date.parse(iso);
    return isNaN(t) ? null : t;
  }
  // Time only e.g. 3pm, 03:30, 11:45 am
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  let mi = m[2] ? parseInt(m[2], 10) : 0;
  const ampm = m[3];
  if (ampm) {
    if (hh === 12) hh = 0;
    if (ampm === 'pm') hh += 12;
  }
  const base = new Date(baseMs || Date.now());
  base.setHours(hh, mi, 0, 0);
  return base.getTime();
}
