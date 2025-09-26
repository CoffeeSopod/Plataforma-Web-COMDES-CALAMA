import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../lib/db.js';

const r = Router();

/* ========== Helpers RUT/Email ========== */

// quita puntos/guiones/espacios, DV en mayúscula
function cleanRut(rut) {
  return String(rut || '')
    .replace(/\./g, '')
    .replace(/-/g, '')
    .replace(/\s+/g, '')
    .toUpperCase();
}

// valida RUT chileno (DV)
function validarRut(rut) {
  const c = cleanRut(rut);
  if (!/^[0-9]+[0-9K]$/.test(c)) return false;
  const dv = c.slice(-1);
  const num = c.slice(0, -1);
  let suma = 0, mul = 2;
  for (let i = num.length - 1; i >= 0; i--) {
    suma += parseInt(num[i], 10) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const res = 11 - (suma % 11);
  const dvCalc = res === 11 ? '0' : res === 10 ? 'K' : String(res);
  return dvCalc === dv;
}

// normaliza a "NNNNNNNN-D" (sin puntos, con guion, DV en mayúscula)
function formatRutWithDash(rut) {
  const c = cleanRut(rut);
  if (c.length < 2) return c;
  return `${c.slice(0, -1)}-${c.slice(-1)}`;
}

// email a minúscula/trim
const normEmail = (s) => String(s || '').trim().toLowerCase();

/* ========== GET /api/users (listado con paginación/orden/búsqueda) ========== */
// Query: ?search=&page=1&pageSize=10&sort=apellido_paterno&dir=asc
r.get('/', async (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '10', 10), 1), 100);
  const sort = ['rut','nombres','apellido_paterno','apellido_materno','cargo','correo','rol','unidad']
    .includes(req.query.sort) ? req.query.sort : 'apellido_paterno';
  const dir = (req.query.dir || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  const search = (req.query.search || '').trim();
  const roleId = parseInt(req.query.role_id || '', 10);
  const unitId = parseInt(req.query.unit_id || '', 10);
  const onlyOnline = (req.query.only_online === '1' || String(req.query.only_online).toLowerCase() === 'true');
  const offset = (page - 1) * pageSize;

  const where = [];
  const params = [];

  if (search) {
    where.push(`(
      u.rut LIKE ? OR u.nombres LIKE ? OR u.apellido_paterno LIKE ? OR u.apellido_materno LIKE ?
      OR u.cargo LIKE ? OR u.correo LIKE ? OR r.nombre LIKE ? OR un.nombre LIKE ?
    )`);
    for (let i = 0; i < 8; i++) params.push(`%${search}%`);
  }
  if (Number.isFinite(roleId))  { where.push('u.rol_id = ?'); params.push(roleId); }
  if (Number.isFinite(unitId))  { where.push('u.id_unidad = ?'); params.push(unitId); }
  if (onlyOnline)              { where.push('TIMESTAMPDIFF(MINUTE, u.last_seen, NOW()) <= 5'); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sortMap = {
    rut: 'u.rut',
    nombres: 'u.nombres',
    apellido_paterno: 'u.apellido_paterno',
    apellido_materno: 'u.apellido_materno',
    cargo: 'u.cargo',
    correo: 'u.correo',
    rol: 'r.nombre',
    unidad: 'un.nombre'
  };

  const sqlBase = `
    FROM usuario u
    LEFT JOIN rol r     ON r.id  = u.rol_id
    LEFT JOIN unidad un ON un.id = u.id_unidad
    ${whereSql}
  `;

  try {
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${sqlBase}`, params);

    const [rows] = await pool.query(
      `SELECT 
        u.rut, u.nombres, u.apellido_paterno, u.apellido_materno, u.correo, u.cargo,
        r.nombre AS rol, un.nombre AS unidad,
        IFNULL((TIMESTAMPDIFF(MINUTE, u.last_seen, NOW()) <= 5), 0) AS online
      ${sqlBase}
      ORDER BY ${sortMap[sort]} ${dir}
      LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({ page, pageSize, total, rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error listando usuarios' });
  }
});

/* ========== POST /api/users (crear) ========== */
/*
Body JSON:
{
  rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento,
  cargo?, correo, telefono?, rol_id, id_unidad, password?
}
*/
// POST /api/users (crear)
r.post('/', async (req, res) => {
  try {
    let {
      rut,
      nombres,
      apellido_paterno,
      apellido_materno,
      fecha_nacimiento,   // 'YYYY-MM-DD' (si lo usas; si no, puede ir null)
      cargo,
      correo,
      telefono,
      rol_id,
      id_unidad,
      password
    } = req.body || {};

    // ---------- Normalización ----------
    rut = String(rut || '').trim();
    nombres = String(nombres || '').trim();
    apellido_paterno = String(apellido_paterno || '').trim();
    apellido_materno = String(apellido_materno || '').trim(); // OPCIONAL
    fecha_nacimiento = String(fecha_nacimiento || '').trim(); // si no usas, puede ser ''
    cargo = (cargo == null || String(cargo).trim() === '') ? null : String(cargo).trim();
    correo = normEmail(correo);
    telefono = (telefono == null || String(telefono).trim() === '') ? null : String(telefono).trim();

    const rid = Number(rol_id);
    const uid = Number(id_unidad);

    // ---------- Validación campo a campo (friendly) ----------
    const errors = {};
    if (!rut) errors.rut = 'Requerido';
    if (!nombres) errors.nombres = 'Requerido';
    if (!apellido_paterno) errors.apellido_paterno = 'Requerido';
    // apellido_materno -> opcional, no exige
    if (!fecha_nacimiento) errors.fecha_nacimiento = 'Requerido'; // <-- si quieres opcional, comenta esta línea
    if (!correo) errors.correo = 'Requerido';
    if (!Number.isInteger(rid) || rid <= 0) errors.rol_id = 'Selecciona un rol';
    if (!Number.isInteger(uid) || uid <= 0) errors.id_unidad = 'Selecciona una unidad';

    if (Object.keys(errors).length) {
      return res.status(400).json({ message: 'Faltan campos obligatorios', errors });
    }

    // ---------- RUT ----------
    const rutFormatted = formatRutWithDash(rut); // "NNNNNNNN-D"
    if (!validarRut(rutFormatted)) {
      return res.status(400).json({ message: 'RUT inválido', errors: { rut: 'RUT inválido' } });
    }
    const rutKey = cleanRut(rutFormatted); // para comparación sin puntos/guion

    // ---------- Duplicados ----------
    const [[dup]] = await pool.query(
      `
      SELECT
        EXISTS(
          SELECT 1 FROM usuario
          WHERE REPLACE(REPLACE(UPPER(TRIM(rut)), '.', ''), '-', '') = ?
        ) AS rut_dup,
        EXISTS(
          SELECT 1 FROM usuario
          WHERE LOWER(TRIM(correo)) = ?
        ) AS correo_dup
      `,
      [rutKey, correo]
    );
    if (dup?.rut_dup)    return res.status(409).json({ code: 'RUT_TAKEN', message: 'RUT ya existe', errors: { rut: 'Ya registrado' } });
    if (dup?.correo_dup) return res.status(409).json({ code: 'EMAIL_TAKEN', message: 'Correo ya registrado', errors: { correo: 'Ya registrado' } });

    // ---------- FK válidas ----------
    const [[rolOk]] = await pool.query('SELECT COUNT(*) c FROM rol WHERE id = ?', [rid]);
    const [[uniOk]] = await pool.query('SELECT COUNT(*) c FROM unidad WHERE id = ?', [uid]);
    if (!rolOk?.c) return res.status(400).json({ message: 'Rol no válido', errors: { rol_id: 'No existe' } });
    if (!uniOk?.c) return res.status(400).json({ message: 'Unidad no válida', errors: { id_unidad: 'No existe' } });

    // ---------- Password ----------
    const plain =
      password && String(password).trim() !== ''
        ? String(password)
        : Math.random().toString(36).slice(-10) + 'A!';
    const hash = await bcrypt.hash(plain, 12);

    // ---------- Insert ----------
    await pool.query(
      `INSERT INTO usuario
       (rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, cargo,
        last_seen, correo, telefono, password, rol_id, id_unidad)
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?)`,
      [
        rutFormatted,
        nombres,
        apellido_paterno,
        apellido_materno || null,
        fecha_nacimiento || null, // si decides hacerlo opcional
        cargo,
        correo,
        telefono,
        hash,
        rid,
        uid
      ]
    );

    return res.status(201).json({
      ok: true,
      user: {
        rut: rutFormatted,
        nombres,
        apellido_paterno,
        apellido_materno: apellido_materno || null,
        correo,
        rol_id: rid,
        id_unidad: uid,
      },
      tempPassword: (password ? undefined : plain),
    });
  } catch (e) {
    console.error('users/create error:', e);
    return res.status(500).json({ message: 'Error creando usuario' });
  }
});


export default r;
