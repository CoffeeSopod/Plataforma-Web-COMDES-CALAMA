import { Router } from 'express';
import { pool } from '../lib/db.js';

const router = Router();

// Helpers
function genGuiaId() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `GE-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// LISTAR guías (simple)
router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT g.id, g.f_emision, g.estado, g.n_factura, g.f_factura,
              g.id_concepto, g.id_prov, g.created_at,
              (SELECT COUNT(*) FROM guia_entrada_item i WHERE i.guia_id = g.id) AS items
       FROM guia_entrada g
       ORDER BY g.created_at DESC
       LIMIT 200`
    );
    res.json(rows);
  } catch (e) {
    console.error('GET /guia-entrada', e);
    res.status(500).json({ message: 'Error listando guías' });
  }
});

// DETALLE de una guía
router.get('/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const [[guia]] = await pool.query(`SELECT * FROM guia_entrada WHERE id = ? LIMIT 1`, [id]);
    if (!guia) return res.status(404).json({ message: 'Guía no encontrada' });

    const [items] = await pool.query(
      `SELECT i.id, i.medicamento_id, m.nombre, m.princ_act,
              i.lote, i.f_ven, i.cantidad, i.precio_unit, i.proveedor
       FROM guia_entrada_item i
       LEFT JOIN medicamento m ON m.id = i.medicamento_id
       WHERE i.guia_id = ?
       ORDER BY i.id`,
      [id]
    );
    res.json({ guia, items });
  } catch (e) {
    console.error('GET /guia-entrada/:id', e);
    res.status(500).json({ message: 'Error obteniendo guía' });
  }
});

// CREAR guía + items + upsert lotes (TRANSACCIÓN)
router.post('/', async (req, res) => {
  const { guia = null, items = [] } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Debes enviar al menos un ítem' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Cabecera (opcional). Si no viene, guia_id = null (ítems sueltos).
    let guiaId = null;
    if (guia) {
      guiaId = String(guia.id || genGuiaId());
      await conn.query(
        `INSERT INTO guia_entrada (id, f_emision, estado, descripcion, n_factura, f_factura, id_concepto, id_prov)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          guiaId,
          guia.f_emision || new Date(),
          guia.estado || 'vigente',
          guia.descripcion || null,
          guia.n_factura || null,
          guia.f_factura || null,
          guia.id_concepto || null,
          guia.id_prov || null
        ]
      );
    }

    // 2) Por cada ítem:
    for (const it of items) {
      const med = it.medicamento || {};
      const medId = String(med.id || '').trim();
      if (!medId) throw new Error('Ítem sin medicamento.id');

      // 2.1) asegurar ficha de medicamento (insert si no existe; update si mandas nombre/princ_act/estado)
      const [[exists]] = await conn.query(`SELECT id FROM medicamento WHERE id = ? LIMIT 1`, [medId]);
      if (!exists) {
        if (!med.nombre?.trim()) throw new Error(`El medicamento ${medId} no existe y falta 'nombre'`);
        await conn.query(
          `INSERT INTO medicamento (id, nombre, princ_act, estado)
           VALUES (?, ?, ?, ?)`,
          [medId, med.nombre.trim(), med.princ_act || null, med.estado || 'visible']
        );
      } else {
        // si vienen campos, actualiza ficha
        if (med.nombre || med.princ_act || med.estado) {
          await conn.query(
            `UPDATE medicamento
             SET nombre = COALESCE(?, nombre),
                 princ_act = COALESCE(?, princ_act),
                 estado = COALESCE(?, estado)
             WHERE id = ?`,
            [med.nombre || null, med.princ_act || null, med.estado || null, medId]
          );
        }
      }

      // 2.2) registrar ítem (si hay guiaId)
      if (guiaId) {
        await conn.query(
          `INSERT INTO guia_entrada_item
             (guia_id, medicamento_id, lote, f_ven, cantidad, precio_unit, proveedor)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            guiaId,
            medId,
            it.lote,
            it.f_ven,
            Number(it.cantidad) || 0,
            it.precio_unit ?? null,
            it.proveedor ?? null
          ]
        );
      }

      // 2.3) upsert/ACUMULAR en medicamento_lote (inventario único)
      await conn.query(
        `INSERT INTO medicamento_lote (medicamento_id, lote, f_ven, cantidad, proveedor)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           cantidad = cantidad + VALUES(cantidad),
           -- si quisieras proteger f_ven, quita esta línea o valida antes
           f_ven = VALUES(f_ven),
           proveedor = COALESCE(VALUES(proveedor), proveedor)`,
        [
          medId,
          it.lote,
          it.f_ven,
          Number(it.cantidad) || 0,
          it.proveedor ?? null
        ]
      );
    }

    await conn.commit();
    res.json({ ok: true, guia_id: guiaId, items: items.length });
  } catch (e) {
    await conn.rollback();
    console.error('POST /guia-entrada', e);
    res.status(500).json({ message: e.message || 'Error creando guía/entrada' });
  } finally {
    conn.release();
  }
});

export default router;
