import { Router } from 'express';
import { pool } from '../lib/db.js';

const router = Router();

router.get('/roles', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre FROM rol ORDER BY nombre ASC');
    res.json(rows);
  } catch (e) {
    console.error(e); res.status(500).json({ message: 'Error cargando roles' });
  }
});

router.get('/unidades', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre FROM unidad ORDER BY nombre ASC');
    res.json(rows);
  } catch (e) {
    console.error(e); res.status(500).json({ message: 'Error cargando unidades' });
  }
});

export default router;
