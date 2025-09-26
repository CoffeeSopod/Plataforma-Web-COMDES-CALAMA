// backend/src/routes/shortcuts.js
import { Router } from 'express';
import { pool } from '../lib/db.js';
import jwt from 'jsonwebtoken';

const router = Router();

// Si ya tienes this.requireAuth en otro archivo, usa ese.
// Aquí dejo un mini middleware equivalente por claridad:
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

/**
 * GET /api/shortcuts
 * Devuelve los accesos visibles para el usuario autenticado,
 * aplicando:
 *  - activo = 1
 *  - overrides de shortcut_user (allow=0 oculta, allow=1 muestra)
 *  - restricciones por rol (shortcut_role)
 *  - restricciones por unidad (shortcut_unidad)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const rut = req.user?.sub;
    const rolId = req.user?.rol_id ?? null;
    const unidadId = req.user?.id_unidad ?? null;

    // 1) Traer accesos activos
    const [shortcuts] = await pool.query(
      `SELECT id, titulo, descripcion, url, externo, icon_pack, icon_name, grupo, orden
         FROM shortcut
        WHERE activo = 1`
    );

    if (!shortcuts.length) return res.json([]);

    const ids = shortcuts.map(s => s.id);

    // 2) Traer relaciones (solo para los IDs recuperados)
    const [sr]  = await pool.query(
      `SELECT shortcut_id, rol_id
         FROM shortcut_role
        WHERE shortcut_id IN (${ids.map(() => '?').join(',')})`,
      ids
    );

    const [su]  = await pool.query(
      `SELECT shortcut_id, unidad_id
         FROM shortcut_unidad
        WHERE shortcut_id IN (${ids.map(() => '?').join(',')})`,
      ids
    );

    const [ovr] = await pool.query(
      `SELECT shortcut_id, allow
         FROM shortcut_user
        WHERE rut = ?
          AND shortcut_id IN (${ids.map(() => '?').join(',')})`,
      [rut, ...ids]
    );

    // 3) Indizar relaciones
    const rolesMap   = new Map(); // id -> Set(rol_id)
    const unidadesMap= new Map(); // id -> Set(unidad_id)
    const ovrMap     = new Map(); // id -> allow (0/1)

    for (const r of sr) {
      if (!rolesMap.has(r.shortcut_id)) rolesMap.set(r.shortcut_id, new Set());
      rolesMap.get(r.shortcut_id).add(r.rol_id);
    }
    for (const u of su) {
      if (!unidadesMap.has(u.shortcut_id)) unidadesMap.set(u.shortcut_id, new Set());
      unidadesMap.get(u.shortcut_id).add(u.unidad_id);
    }
    for (const o of ovr) {
      // Si existiera más de uno, el último gana (no debería)
      ovrMap.set(o.shortcut_id, Number(o.allow));
    }

    // 4) Resolver visibilidad
    const visible = [];
    for (const s of shortcuts) {
      const ov = ovrMap.get(s.id);
      if (ov === 0) continue;      // forzado oculto
      if (ov === 1) {              // forzado visible
        visible.push(s);
        continue;
      }

      // Si NO hay restricciones de rol -> todos los roles.
      const reqRoles = rolesMap.get(s.id);   // Set o undefined
      const passRol  = !reqRoles || (rolId != null && reqRoles.has(rolId));

      // Si NO hay restricciones de unidad -> todas las unidades.
      const reqUnis = unidadesMap.get(s.id); // Set o undefined
      const passUni = !reqUnis || (unidadId != null && reqUnis.has(unidadId));

      if (passRol && passUni) visible.push(s);
    }

    // 5) Ordenar: grupo (null al final) > orden > titulo
    visible.sort((a, b) => {
      const ag = a.grupo ?? '\uffff'; // envía nulls al final
      const bg = b.grupo ?? '\uffff';
      if (ag !== bg) return ag.localeCompare(bg, 'es');
      if (a.orden !== b.orden) return (a.orden ?? 0) - (b.orden ?? 0);
      return (a.titulo || '').localeCompare(b.titulo || '', 'es');
    });

    return res.json(visible);
  } catch (e) {
    console.error('shortcuts error:', e);
    return res.status(500).json({ message: 'Error obteniendo accesos' });
  }
});

export default router;
