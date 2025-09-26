import { Router } from 'express';
import path from 'path';
import multer from 'multer';
import { pool } from '../lib/db.js';

const router = Router();

// LISTA de catálogo + stock (lee desde la vista)
router.get('/search', async (req, res) => {
  try {
    const q = String(req.query.query || '').trim().toLowerCase();
    if (!q) return res.json([]);
    const [rows] = await pool.query(
      `SELECT id, nombre, princ_act
       FROM medicamento
       WHERE LOWER(id) LIKE ? OR LOWER(nombre) LIKE ?
       ORDER BY nombre LIMIT 50`,
      [`%${q}%`, `%${q}%`]
    );
    res.json(rows);
  } catch (e) {
    console.error('GET /medicamentos/search', e);
    res.status(500).json([]);
  }
});

router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, nombre, princ_act, img, estado, stock_total, proximo_venc
       FROM v_medicamento_stock
       ORDER BY nombre`
    );
    res.json(rows);
  } catch (e) {
    console.error('GET /medicamentos', e);
    res.status(500).json({ message: 'Error listando medicamentos' });
  }
});

// CREAR/ACTUALIZAR ficha de catálogo
router.post('/', async (req, res) => {
  try {
    const { id, nombre, princ_act = null, estado = 'visible', img = null } = req.body || {};
    if (!id?.trim() || !nombre?.trim()) {
      return res.status(400).json({ message: 'id y nombre son requeridos' });
    }
    await pool.query(
      `INSERT INTO medicamento (id, nombre, princ_act, img, estado)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         nombre = VALUES(nombre),
         princ_act = VALUES(princ_act),
         img = COALESCE(VALUES(img), img),
         estado = VALUES(estado)`,
      [id.trim(), nombre.trim(), princ_act, img, estado]
    );
    res.json({ ok: true, id: id.trim() });
  } catch (e) {
    console.error('POST /medicamentos', e);
    res.status(500).json({ message: 'Error guardando medicamento' });
  }
});

// LOTES de un medicamento
router.get('/:id/lotes', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const [rows] = await pool.query(
      `SELECT id, medicamento_id, lote, f_ven, cantidad, proveedor, f_regis, estado
       FROM medicamento_lote
       WHERE medicamento_id = ?
       ORDER BY f_ven ASC, lote ASC`,
      [id]
    );
    res.json(rows);
  } catch (e) {
    console.error('GET /medicamentos/:id/lotes', e);
    res.status(500).json({ message: 'Error obteniendo lotes' });
  }
});

// SUBIR IMAGEN
const upload = multer({
  dest: path.resolve('uploads/meds'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

router.post('/:id/image', upload.single('file'), async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const { filename } = req.file || {};
    if (!id || !filename) return res.status(400).json({ message: 'Falta id o archivo' });

    const url = `/uploads/meds/${filename}`;
    await pool.query(`UPDATE medicamento SET img = ? WHERE id = ?`, [url, id]);
    res.json({ ok: true, url });
  } catch (e) {
    console.error('POST /medicamentos/:id/image', e);
    res.status(500).json({ message: 'Error subiendo imagen' });
  }
});

export default router;
