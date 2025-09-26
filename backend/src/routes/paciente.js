// backend/src/routes/pacientes.js
import { Router } from 'express';
import { pool } from '../lib/db.js';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { cleanRut, formatRutWithDash, asDateISO } from '../lib/strings.js';

const r = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// Helpers de búsqueda
const likeParams = (q) => Array(6).fill(`%${q}%`);

// GET /api/pacientes?search=&page=1&pageSize=10&sort=ap_pat&dir=asc
r.get('/', async (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '10', 10), 1), 100);
  const dir = (req.query.dir || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  // columnas permitidas para orden
  const sort = ['rut','nombres','ap_pat','ap_mat','prevision','f_nac','f_inscrip','f_receta']
    .includes(req.query.sort) ? req.query.sort : 'ap_pat';

  const offset = (page - 1) * pageSize;
  const search = (req.query.search || '').trim();

  const where = [];
  const params = [];

  if (search) {
    where.push(`(
      p.rut LIKE ? OR p.nombres LIKE ? OR p.ap_pat LIKE ? OR p.ap_mat LIKE ? 
      OR p.prevision LIKE ? OR CONCAT(p.nombres, ' ', p.ap_pat, ' ', p.ap_mat) LIKE ?
    )`);
    params.push(...likeParams(search));
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sqlBase = `
    FROM paciente p
    ${whereSql}
  `;

  try {
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${sqlBase}`, params);

    const [rows] = await pool.query(
      `SELECT 
        p.rut, p.nombres, p.ap_pat, p.ap_mat, p.prevision, 
        p.f_nac, p.tel_fijo, p.celular, p.f_inscrip, p.f_receta
      ${sqlBase}
      ORDER BY ${sort} ${dir}
      LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({ page, pageSize, total, rows });
  } catch (e) {
    console.error('pacientes list error:', e);
    res.status(500).json({ message: 'Error listando pacientes' });
  }
});

r.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Falta archivo' });

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true });

    // Solo obligatorios:
    const must = ['C. IDENTIDAD', 'NOMBRES'];
    const first = rows[0] || {};
    const headers = new Set(Object.keys(first).map(h => String(h).trim().toUpperCase()));
    const miss = must.filter(h => !headers.has(h));
    if (miss.length) {
      return res.status(400).json({ message: `Faltan columnas obligatorias: ${miss.join(', ')}` });
    }

    const get = (row, key) => row[key] ?? null;

    const errors = [];
    let inserted = 0, updated = 0, processed = 0;

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];

      const rutRaw   = get(raw, 'C. IDENTIDAD');
      const nombres  = String(get(raw, 'NOMBRES') ?? '').trim();

      // opcionales
      const ap_pat    = (get(raw, 'APELLIDO PATERNO') ?? '').toString().trim() || null;
      const ap_mat    = (get(raw, 'APELLIDO MATERNO') ?? '').toString().trim() || null;
      const prevision = (get(raw, 'PREVISION') ?? '').toString().trim() || null;

      const f_nac     = asDateISO(get(raw, 'F NAC')) || null;
      const f_inscrip = asDateISO(get(raw, 'FECHA INSCRIPCION')) || null;
      const f_receta  = asDateISO(get(raw, 'FECHA RECETA')) || null;

      const tel_fijo  = (get(raw, 'TELEFONO FIJO') ?? '').toString().trim() || null;
      const celular   = (get(raw, 'CELULAR') ?? '').toString().trim() || null;

      const rowErr = [];
      const rut = formatRutWithDash(rutRaw || '');

      if (!rutRaw || !rut) rowErr.push('RUT vacío/ inválido');
      if (!nombres) rowErr.push('NOMBRES vacío');

      if (rowErr.length) {
        errors.push({ row: i + 2, rut: rutRaw, errors: rowErr });
        continue;
      }

      try {
        const [result] = await pool.query(
          `INSERT INTO paciente
             (rut, nombres, ap_pat, ap_mat, prevision, f_nac, tel_fijo, celular, f_inscrip, f_receta)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             nombres=VALUES(nombres),
             ap_pat=VALUES(ap_pat),
             ap_mat=VALUES(ap_mat),
             prevision=VALUES(prevision),
             f_nac=VALUES(f_nac),
             tel_fijo=VALUES(tel_fijo),
             celular=VALUES(celular),
             f_inscrip=VALUES(f_inscrip),
             f_receta=VALUES(f_receta)`,
          [rut, nombres, ap_pat, ap_mat, prevision, f_nac, tel_fijo, celular, f_inscrip, f_receta]
        );
        processed++;
        if (result.affectedRows === 1) inserted++; else updated++;
      } catch (e) {
        errors.push({ row: i + 2, rut, errors: ['Error SQL'] });
      }
    }

    res.json({ ok: errors.length === 0, processed, inserted, updated, errors });
  } catch (e) {
    console.error('pacientes/import error:', e);
    res.status(500).json({ message: 'Error importando' });
  }
});


export default r;
