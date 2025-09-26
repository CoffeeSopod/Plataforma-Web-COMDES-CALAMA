import { Router } from 'express';
import { pool } from '../lib/db.js';

const router = Router();

router.get('/proveedores', async (_req, res) => {
  try {
    const [rows] = await pool.query(`SELECT id, nombre FROM proveedor ORDER BY nombre`);
    res.json(rows);
  } catch (e) {
    console.error('GET /catalogos/proveedores', e);
    res.status(500).json({ message: 'Error listando proveedores' });
  }
});

router.get('/conceptos', async (_req, res) => {
  try {
    const [rows] = await pool.query(`SELECT id, nombre FROM concepto ORDER BY nombre`);
    res.json(rows);
  } catch (e) {
    console.error('GET /catalogos/conceptos', e);
    res.status(500).json({ message: 'Error listando conceptos' });
  }
});

export default router;
