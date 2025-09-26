// src/routes/boletas.js
import { Router } from "express";
import { pool } from "../lib/db.js";

const router = Router();

/* ================= Utils ================= */
function nowISODateTime() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
/** Convierte "YYYY-MM-DDTHH:mm" o "YYYY-MM-DD HH:mm[:ss]" a "YYYY-MM-DD HH:mm:ss" */
function normalizeDTLocal(s) {
  if (!s) return null;
  const m = String(s).trim().match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return s;
  return `${m[1]} ${m[2]}:${m[3]}:${m[4] || "00"}`;
}

/** Requiere usuario autenticado. Espera que un middleware de auth pobló `req.user`.
 *  Para desarrollo admite header `x-user-rut`. */
function requireUser(req, res, next) {
  const u = req.user || req.auth || (req.session && req.session.user) || null;
  const rut = u?.rut || u?.id || req.headers["x-user-rut"]; // fallback dev
  if (!rut) return res.status(401).json({ message: "No autenticado" });
  req._rut = String(rut);
  next();
}

/** Saber quién soy (para prefijar el formulario) */
router.get("/me", requireUser, (req, res) => {
  res.json({ rut: req._rut });
});

/* =============== AUTOCOMPLETE =============== */

/** GET /api/boletas/search/pacientes?q=... */
router.get("/search/pacientes", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json([]);

    const like = `%${q}%`;
    const [rows] = await pool.query(
      `
      SELECT
        p.rut AS id,
        CONCAT_WS(' ', p.nombres, p.ap_pat, p.ap_mat) AS name
      FROM paciente p
      WHERE p.rut LIKE ? OR p.nombres LIKE ? OR p.ap_pat LIKE ? OR p.ap_mat LIKE ?
      ORDER BY p.nombres, p.ap_pat, p.ap_mat
      LIMIT 20
      `,
      [like, like, like, like]
    );
    res.json(rows);
  } catch (e) {
    console.error("search pacientes error", e);
    res.status(500).json([]);
  }
});

/** GET /api/boletas/search/medicamentos?q=... */
router.get("/search/medicamentos", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json([]);

    const like = `%${q}%`;
    const [rows] = await pool.query(
      `
      SELECT
        m.id,
        m.nombre,
        m.princ_act,
        COALESCE(SUM(CASE WHEN ml.estado='ok' THEN ml.cantidad ELSE 0 END), 0) AS stock_total,
        MIN(CASE WHEN ml.estado='ok' AND ml.cantidad > 0 THEN ml.f_ven END) AS proximo_venc
      FROM medicamento m
      LEFT JOIN medicamento_lote ml ON ml.medicamento_id = m.id
      WHERE m.id LIKE ? OR m.nombre LIKE ? OR m.princ_act LIKE ?
      GROUP BY m.id, m.nombre, m.princ_act
      ORDER BY m.nombre
      LIMIT 50
      `,
      [like, like, like]
    );
    res.json(rows);
  } catch (e) {
    console.error("search medicamentos error", e);
    res.status(500).json([]);
  }
});

/* =============== LISTADO Y DETALLE =============== */

/** GET /api/boletas
 * Query: page, pageSize, search (id boleta / rut / nombre paciente), estado (vigente|vencido)
 */
router.get("/", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || "10", 10), 1), 100);
    const offset = (page - 1) * pageSize;

    const search = String(req.query.search || "").trim();
    const estado = String(req.query.estado || "").trim().toLowerCase(); // vigente|vencido|''

    const where = [];
    const params = [];
    if (search) {
      where.push(`(
        b.id LIKE ? OR
        p.rut LIKE ? OR
        CONCAT_WS(' ', p.nombres, p.ap_pat, p.ap_mat) LIKE ?
      )`);
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (estado === "vigente" || estado === "vencido") {
      where.push(`b.estado = ?`);
      params.push(estado);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [[countRow]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM boleta b
      LEFT JOIN paciente p ON p.rut = b.id_paciente
      ${whereSql}
      `,
      params
    );
    const total = countRow?.total || 0;

    const [rows] = await pool.query(
      `
      SELECT
        b.id, b.estado, b.f_emision, b.v_total,
        p.rut AS paciente_id,
        CONCAT_WS(' ', p.nombres, p.ap_pat, p.ap_mat) AS paciente_nombre,
        (SELECT COUNT(*) FROM boleta_item bi WHERE bi.boleta_id = b.id) AS items
      FROM boleta b
      LEFT JOIN paciente p ON p.rut = b.id_paciente
      ${whereSql}
      ORDER BY b.f_emision DESC, b.id DESC
      LIMIT ? OFFSET ?
      `,
      [...params, pageSize, offset]
    );

    res.json({ rows, total });
  } catch (e) {
    console.error("GET /api/boletas error:", e);
    res.status(500).json({ message: "Error interno al listar boletas" });
  }
});

/** GET /api/boletas/:id (detalle con items y trazabilidad por lotes) */
router.get("/:id", async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ message: "id requerido" });

    const [[b]] = await pool.query(
      `
      SELECT
        b.id, b.estado, b.descripcion, b.f_emision, b.v_neto, b.v_total,
        b.id_paciente,
        CONCAT_WS(' ', p.nombres, p.ap_pat, p.ap_mat) AS paciente_nombre,
        b.id_usuario
      FROM boleta b
      LEFT JOIN paciente p ON p.rut = b.id_paciente
      WHERE b.id = ?
      `,
      [id]
    );
    if (!b) return res.status(404).json({ message: "Boleta no encontrada" });

    const [items] = await pool.query(
      `
      SELECT bi.id, bi.medicamento_id, m.nombre, m.princ_act,
             bi.cantidad, bi.precio_unit, (bi.cantidad * bi.precio_unit) AS subtotal
      FROM boleta_item bi
      LEFT JOIN medicamento m ON m.id = bi.medicamento_id
      WHERE bi.boleta_id = ?
      `,
      [id]
    );

    const [lots] = await pool.query(
      `
      SELECT bil.boleta_item_id, bil.lote_id, ml.lote, ml.f_ven, bil.cantidad
      FROM boleta_item_lote bil
      JOIN medicamento_lote ml ON ml.id = bil.lote_id
      WHERE bil.boleta_item_id IN (
        SELECT id FROM boleta_item WHERE boleta_id = ?
      )
      ORDER BY ml.f_ven, ml.id
      `,
      [id]
    );

    res.json({ boleta: b, items, items_lotes: lots });
  } catch (e) {
    console.error("GET /api/boletas/:id error:", e);
    res.status(500).json({ message: "Error interno al cargar boleta" });
  }
});

/* =============== CREAR BOLETA (FEFO + transacción + trazabilidad) =============== */
router.post("/", requireUser, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const {
      id,               // permitir ID manual (boleta física)
      id_caja = null,
      estado = "vigente",
      descripcion = null,
      f_emision,        // puede venir vacío; se normaliza/auto
      id_paciente,
      items = []
    } = req.body || {};

    if (!id_paciente) { conn.release(); return res.status(400).json({ message: "id_paciente requerido" }); }
    if (!Array.isArray(items) || items.length === 0) { conn.release(); return res.status(400).json({ message: "Debe incluir al menos 1 item" }); }

    const cleanItems = items.map(it => ({
      medicamento_id: String(it.medicamento_id || "").trim(),
      cantidad: Math.max(parseInt(it.cantidad, 10) || 0, 0),
      precio_unit: Number(it.precio_unit ?? 0)
    })).filter(it => it.medicamento_id && it.cantidad > 0);
    if (cleanItems.length === 0) { conn.release(); return res.status(400).json({ message: "Items inválidos" }); }

    const boletaId = (id && String(id).trim()) || `B-${Date.now()}`;
    const fEm = normalizeDTLocal(f_emision) || nowISODateTime();
    const userRut = req._rut;

    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO boleta (id, id_caja, estado, descripcion, f_emision, id_paciente, v_neto, v_total, id_usuario)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?)`,
      [boletaId, id_caja, estado, descripcion, fEm, id_paciente, userRut]
    );

    let vNeto = 0;
    const affectedMedIds = new Set();

    for (const it of cleanItems) {
      // FEFO: bloquear lotes disponibles ordenados por fecha de vencimiento
      const [lots] = await conn.query(
        `SELECT id, cantidad, f_ven, estado
         FROM medicamento_lote
         WHERE medicamento_id = ? AND cantidad > 0 AND estado <> 'bloqueado'
         ORDER BY f_ven ASC, id ASC
         FOR UPDATE`,
        [it.medicamento_id]
      );

      let need = it.cantidad;
      const alloc = [];
      for (const l of lots) {
        if (need <= 0) break;
        const take = Math.min(need, Number(l.cantidad));
        if (take > 0) { alloc.push({ lote_id: l.id, take }); need -= take; }
      }
      if (need > 0) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ message: `Stock insuficiente para ${it.medicamento_id}. Falta ${need} unidades` });
      }

      const [insItem] = await conn.query(
        `INSERT INTO boleta_item (boleta_id, medicamento_id, cantidad, precio_unit)
         VALUES (?, ?, ?, ?)`,
        [boletaId, it.medicamento_id, it.cantidad, it.precio_unit]
      );
      const itemId = insItem.insertId;

      for (const a of alloc) {
        await conn.query(
          `INSERT INTO boleta_item_lote (boleta_item_id, lote_id, cantidad) VALUES (?, ?, ?)`,
          [itemId, a.lote_id, a.take]
        );
        await conn.query(
          `UPDATE medicamento_lote SET cantidad = cantidad - ? WHERE id = ?`,
          [a.take, a.lote_id]
        );
      }

      vNeto += it.cantidad * it.precio_unit;
      affectedMedIds.add(it.medicamento_id);
    }

    // Refrescar agregados en medicamentos afectados
    if (affectedMedIds.size) {
      const ids = Array.from(affectedMedIds);
      const ph = ids.map(() => "?").join(",");
      await conn.query(
        `UPDATE medicamento m
         LEFT JOIN (
           SELECT medicamento_id,
                  SUM(cantidad) AS stock_total,
                  MIN(CASE WHEN estado='ok' AND cantidad > 0 THEN f_ven END) AS prox
           FROM medicamento_lote
           WHERE medicamento_id IN (${ph})
           GROUP BY medicamento_id
         ) s ON s.medicamento_id = m.id
         SET m.cantidad = COALESCE(s.stock_total, 0),
             m.proximo_venc = s.prox
         WHERE m.id IN (${ph})`,
        [...ids, ...ids]
      );
    }

    await conn.query(`UPDATE boleta SET v_neto = ?, v_total = ? WHERE id = ?`, [vNeto, vNeto, boletaId]);

    await conn.commit();
    conn.release();
    res.json({ ok: true, id: boletaId, v_neto: vNeto, v_total: vNeto });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    conn?.release?.();
    console.error("POST /api/boletas error:", e);
    res.status(500).json({ message: "Error creando boleta" });
  }
});

export default router;
