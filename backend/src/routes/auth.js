import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool } from '../lib/db.js';

const router = Router();
const norm = v => String(v||'').trim().toLowerCase();

/* Util: nombre sugerido para mostrar (no concatenado obligatorio) */
function makeDisplayName(u){
  const first = String(u?.nombres || '').trim().split(/\s+/)[0] || '';
  const ap   = String(u?.apellido_paterno || '').trim();
  const am   = String(u?.apellido_materno || '').trim();
  return [first, ap, am].filter(Boolean).join(' ').trim() || null;
}

/* ------- LOGIN ------- */
router.post('/login', async (req, res) => {
  const email = norm(req.body?.email);
  const password = req.body?.password ?? '';
  if (!email || !password) return res.status(400).json({ message: 'Faltan campos' });

  const [rows] = await pool.query(
    `SELECT u.rut, u.nombres, u.apellido_paterno, u.apellido_materno,
            u.correo, u.password, u.rol_id, u.id_unidad,
            r.nombre AS rol, un.nombre AS unidad
     FROM usuario u
     LEFT JOIN rol r  ON r.id  = u.rol_id
     LEFT JOIN unidad un ON un.id = u.id_unidad
     WHERE TRIM(LOWER(u.correo)) = TRIM(LOWER(?)) LIMIT 1`,
    [email]
  );
  const user = rows[0];
  if (!user || !user.password) return res.status(401).json({ message: 'Credenciales inválidas' });

  // normaliza prefijo si el hash viene de PHP ($2y$)
  let hash = (user.password || '').trim();
  if (hash.startsWith('$2y$')) hash = '$2a$' + hash.slice(4);

  const ok = await bcrypt.compare(password, hash);
  if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });

  // presenciar
  await pool.query('UPDATE usuario SET last_seen = NOW() WHERE rut = ?', [user.rut]);

  // ⚠️ Token con campos separados (sin concatenar nombre)
  const tokenPayload = {
    sub: user.rut,
    email: user.correo,
    rol_id: user.rol_id,
    id_unidad: user.id_unidad,
    rol: user.rol ?? null,
    unidad: user.unidad ?? null,
    // Opcional: incluir nombres/apellidos en el token si te sirve en el FE
    nombres: user.nombres,
    apellido_paterno: user.apellido_paterno,
    apellido_materno: user.apellido_materno
  };

  const token = jwt.sign(
    tokenPayload,
    process.env.JWT_SECRET || 'devsecret',
    { expiresIn: '60m' }
  );

  // ✅ Respuesta sin concatenación
  res.json({
    user: {
      id: user.rut,
      correo: user.correo,
      rol: user.rol ?? null,
      unidad: user.unidad ?? null,
      rol_id: user.rol_id,
      id_unidad: user.id_unidad,
      nombres: user.nombres,
      apellido_paterno: user.apellido_paterno,
      apellido_materno: user.apellido_materno,
      // opcional: solo para UI; si no lo quieres, bórralo
      display_name: makeDisplayName(user)
    },
    token
  });
});

/* ------- Middleware: requiere JWT ------- */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'No autorizado' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido/expirado' });
  }
}

/* ------- GET /api/auth/me ------- */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.rut, u.nombres, u.apellido_paterno, u.apellido_materno, u.correo,
              r.nombre AS rol, un.nombre AS unidad, u.rol_id, u.id_unidad
       FROM usuario u
       LEFT JOIN rol r  ON r.id  = u.rol_id
       LEFT JOIN unidad un ON un.id = u.id_unidad
       WHERE u.rut = ? LIMIT 1`,
      [req.user.sub]
    );
    const u = rows[0];
    if (!u) return res.status(404).json({ message: 'No encontrado' });

    res.json({
      id: u.rut,
      correo: u.correo,
      rol: u.rol ?? null,
      unidad: u.unidad ?? null,
      rol_id: u.rol_id,
      id_unidad: u.id_unidad,
      nombres: u.nombres,
      apellido_paterno: u.apellido_paterno,
      apellido_materno: u.apellido_materno,
      // opcional: solo para UI; si no lo quieres, bórralo
      display_name: makeDisplayName(u)
    });
  } catch (e) {
    console.error('auth/me error:', e);
    res.status(500).json({ message: 'Error interno' });
  }
});

/* ------- POST /api/auth/heartbeat ------- */
router.post('/heartbeat', requireAuth, async (req, res) => {
  try {
    await pool.query('UPDATE usuario SET last_seen = NOW() WHERE rut = ?', [req.user.sub]);
    res.json({ ok: true });
  } catch (e) {
    console.error('heartbeat error:', e);
    res.status(500).json({ message: 'Error actualizando presencia' });
  }
});

export default router;
