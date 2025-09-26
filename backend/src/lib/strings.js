// backend/src/lib/strings.js
export function cleanRut(rut) {
  return String(rut || '')
    .replace(/\./g, '')
    .replace(/-/g, '')
    .replace(/\s+/g, '')
    .toUpperCase();
}
export function formatRutWithDash(rut) {
  const c = cleanRut(rut);
  if (c.length < 2) return c;
  return `${c.slice(0,-1)}-${c.slice(-1)}`;
}
export function asDateISO(v) {
  // acepta Date, serial de Excel, o 'yyyy-mm-dd'
  if (!v && v !== 0) return null;
  if (v instanceof Date) return isNaN(v) ? null : v.toISOString().slice(0,10);
  if (typeof v === 'number') {
    // serial Excel (1900-based)
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return isNaN(d) ? null : d.toISOString().slice(0,10);
  }
  const s = String(v).trim();
  // ya viene yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // dd-mm-yyyy o dd/mm/yyyy
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const [_, dd, mm, yyyy] = m;
    const d = new Date(`${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`);
    return isNaN(d) ? null : d.toISOString().slice(0,10);
  }
  const d = new Date(s);
  return isNaN(d) ? null : d.toISOString().slice(0,10);
}
