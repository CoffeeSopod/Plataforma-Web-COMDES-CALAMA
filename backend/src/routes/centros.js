import { Router } from 'express';
import { pool } from '../lib/db.js';

const r = Router();

r.get('/centros', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, slug, nombre_salud, url_logo FROM centros_salud ORDER BY nombre_salud`
  );
  res.set('Cache-Control', 'public, max-age=60'); // 1 min
  res.json(rows);
});

r.get('/centros/:slug', async (req, res) => {
  const { slug } = req.params;
  const [rows] = await pool.query(`SELECT * FROM centros_salud WHERE slug=? LIMIT 1`, [slug]);
  if (!rows.length) return res.status(404).json({ error: 'Centro no encontrado' });
  res.set('Cache-Control', 'public, max-age=60');
  res.json(rows[0]);
});

export default r;
