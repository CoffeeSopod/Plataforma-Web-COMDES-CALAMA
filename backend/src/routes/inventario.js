// src/routes/inventario.js
import { Router } from "express";
import { pool } from "../lib/db.js";
import multer from "multer";
import XLSX from "xlsx";

const router = Router();

/* ========= Upload en memoria para XLSX/CSV ========= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

/* ========= Utils de fecha ========= */
function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Convierte celda de Excel (serial, dd/mm/yyyy, yyyy-mm-dd, etc.) a 'YYYY-MM-DD' o null */
function parseDateCell(v) {
  if (!v && v !== 0) return null;

  // Serial Excel
  if (typeof v === "number" && Number.isFinite(v)) {
    const epoch = Date.UTC(1899, 11, 30);
    const ms = epoch + v * 86400000;
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return toISO(d);
  }

  if (typeof v === "string") {
    const s = v.trim().replace(/\./g, "/").replace(/-/g, "/");

    // dd/mm/yyyy o mm/dd/yyyy (heurística: si primer número > 12 interpretamos dd/mm)
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (m) {
      let [, a, b, c] = m;
      if (c.length === 2) c = (Number(c) + 2000).toString();
      const dd = Number(a), mm = Number(b);
      const isDMY = dd > 12;
      const d = isDMY ? new Date(Number(c), mm - 1, dd) : new Date(Number(c), dd - 1, mm);
      if (!Number.isNaN(d.getTime())) return toISO(d);
    }

    // yyyy/mm/dd
    const m2 = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (m2) {
      const d = new Date(Number(m2[1]), Number(m2[2]) - 1, Number(m2[3]));
      if (!Number.isNaN(d.getTime())) return toISO(d);
    }
  }
  return null;
}

const norm = (s) => (s ?? "").toString().trim();
const sameKey = ({ id, lote, f_ven }) => `${id}||${lote}||${f_ven}`;

/* =======================================================================================
   GET /api/inventario
   Query: page, pageSize, sort (id|nombre|estado|stock_total|proximo_venc|lotes), dir, search
   Respuesta: { rows: [...], total }
======================================================================================= */
router.get("/inventario", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || "10", 10), 1), 100);
    const offset = (page - 1) * pageSize;

    const sort = String(req.query.sort || "nombre").toLowerCase();
    const dir = String(req.query.dir || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";
    const search = String(req.query.search || "").trim();

    const where = [];
    const params = [];
    if (search) {
      const like = `%${search}%`;
      where.push(`(m.id LIKE ? OR m.nombre LIKE ? OR m.princ_act LIKE ?)`);
      params.push(like, like, like);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // total de medicamentos (catálogo), aunque no tengan lotes
    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) AS total FROM medicamento m ${whereSql}`,
      params
    );
    const total = countRow?.total ?? 0;

    // Orden
    const minVenceExpr = `MIN(CASE WHEN ml.estado='ok' AND ml.cantidad > 0 THEN ml.f_ven END)`;
    let orderSql = `m.nombre ${dir}`;
    switch (sort) {
      case "id":          orderSql = `m.id ${dir}`; break;
      case "nombre":      orderSql = `m.nombre ${dir}`; break;
      case "estado":      orderSql = `m.estado ${dir}, m.nombre ASC`; break;
      case "stock_total": orderSql = `stock_total ${dir}, m.nombre ASC`; break;
      case "lotes":       orderSql = `lotes ${dir}, m.nombre ASC`; break;
      case "proximo_venc":
        // nulls al final
        orderSql = `(${minVenceExpr} IS NULL) ASC, ${minVenceExpr} ${dir}, m.nombre ASC`;
        break;
    }

    // Agregado por medicamento
    const [rows] = await pool.query(
      `
      SELECT
        m.id,
        m.nombre,
        m.princ_act,
        m.img,
        m.estado,
        COALESCE(SUM(CASE WHEN ml.estado='ok' THEN ml.cantidad ELSE 0 END), 0) AS stock_total,
        ${minVenceExpr} AS proximo_venc,
        COUNT(ml.id) AS lotes
      FROM medicamento m
      LEFT JOIN medicamento_lote ml
        ON ml.medicamento_id = m.id
      ${whereSql}
      GROUP BY m.id, m.nombre, m.princ_act, m.img, m.estado
      ORDER BY ${orderSql}
      LIMIT ? OFFSET ?
      `,
      [...params, pageSize, offset]
    );

    res.json({ rows, total });
  } catch (e) {
    console.error("GET /api/inventario error:", e.sqlMessage || e.message, e.sql || "");
    res.status(500).json({ message: "Error interno al cargar inventario" });
  }
});

/* =======================================================================================
   GET /api/inventario/:id  -> detalle de un medicamento + lotes
======================================================================================= */
router.get("/inventario/:id", async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ message: "id requerido" });

    const [[med]] = await pool.query(
      `SELECT id, nombre, princ_act, img, estado FROM medicamento WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!med) return res.status(404).json({ message: "No encontrado" });

    const [lotes] = await pool.query(
      `
      SELECT id, lote, f_ven, cantidad, proveedor, estado, f_regis
      FROM medicamento_lote
      WHERE medicamento_id = ?
      ORDER BY f_ven ASC, id ASC
      `,
      [id]
    );

    res.json({ medicamento: med, lotes });
  } catch (e) {
    console.error("GET /api/inventario/:id error:", e.sqlMessage || e.message, e.sql || "");
    res.status(500).json({ message: "Error interno al cargar detalle" });
  }
});

/* =======================================================================================
   POST /api/inventario/import  -> importar XLSX/CSV sin guía (guia_id = NULL)
   Columnas esperadas (flexible): 
     - Cod. Producto / Código / ID / SKU
     - Proveedor
     - Producto / Nombre
     - Principio Activo
     - Partida / Talla / Lote
     - Fecha Venc / Vence / Vencimiento
     - Cantidad (opcional, defecto 1)
======================================================================================= */
router.post("/inventario/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Archivo requerido (xlsx/csv)" });

    const wb = XLSX.read(req.file.buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) return res.status(400).json({ message: "Hoja vacía" });

    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

    // helper p/columnas con nombres distintos
    const mapCol = (obj, keys) => {
      const entries = Object.entries(obj);
      const lowered = keys.map((k) => k.toLowerCase());
      for (const [k, v] of entries) {
        if (lowered.includes(k.trim().toLowerCase())) return v;
      }
      return undefined;
    };

    // Normaliza & agrupa
    const todayISO = toISO(new Date());
    const grouped = new Map();
    let rawCount = 0, skipped = 0;

    for (const r of rows) {
      rawCount++;

      const id = norm(mapCol(r, ["Cod. Producto", "Código", "Codigo", "ID", "SKU"]));
      const nombre = norm(mapCol(r, ["Producto", "Nombre"]));
      const princ_act = norm(mapCol(r, ["Principio Activo", "Principio_Activo"]));
      const proveedor = norm(mapCol(r, ["Proveedor"]));
      const lote = norm(mapCol(r, ["Partida / Talla", "Lote", "Partida", "Talla"]));
      const fvenRaw = mapCol(r, ["Fecha Venc", "Vence", "Vencimiento", "Fecha de Vencimiento"]);
      const f_ven = parseDateCell(fvenRaw);
      let cantidad = mapCol(r, ["Cantidad", "Qty", "Q"]);

      // mínimos obligatorios
      if (!id || !lote || !f_ven) { skipped++; continue; }

      cantidad = Number(cantidad ?? 1);
      if (!Number.isFinite(cantidad) || cantidad <= 0) cantidad = 1;

      const key = sameKey({ id, lote, f_ven });
      const prev = grouped.get(key);
      if (prev) {
        prev.cantidad += cantidad;
      } else {
        grouped.set(key, { id, nombre, princ_act, proveedor, lote, f_ven, cantidad });
      }
    }

    const items = Array.from(grouped.values());
    if (items.length === 0) {
      return res.status(400).json({ message: "No hay filas válidas para importar" });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      /* 1) UPSERT de 'medicamento' (catálogo)
            - Crea si no existe
            - Si existe, completa nombre/princ_act si estaban vacíos/NULL
       */
      const meds = Array.from(new Set(items.map((x) => x.id)));
      if (meds.length) {
        const values = meds.map(() => "(?, ?, ?, 'visible')").join(",");
        const params = [];
        for (const id of meds) {
          const sample = items.find((x) => x.id === id) || {};
          params.push(id, sample.nombre || id, sample.princ_act || null);
        }
        await conn.query(
          `
          INSERT INTO medicamento (id, nombre, princ_act, estado)
          VALUES ${values}
          ON DUPLICATE KEY UPDATE
            nombre    = COALESCE(NULLIF(VALUES(nombre), ''), nombre),
            princ_act = COALESCE(NULLIF(VALUES(princ_act), ''), princ_act)
          `,
          params
        );
      }

      /* 2) UPSERT de lotes + rastro en guia_entrada_item (guia_id NULL) */
      const insLote = `
        INSERT INTO medicamento_lote (medicamento_id, lote, f_ven, cantidad, proveedor, estado)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          cantidad  = cantidad + VALUES(cantidad),
          f_ven     = IF(VALUES(f_ven) < f_ven, VALUES(f_ven), f_ven),
          proveedor = COALESCE(VALUES(proveedor), proveedor),
          estado    = IF(VALUES(f_ven) < CURDATE(), 'vencido', estado)
      `;
      const insGEI = `
        INSERT INTO guia_entrada_item (guia_id, medicamento_id, lote, f_ven, cantidad, proveedor)
        VALUES (NULL, ?, ?, ?, ?, ?)
      `;

      let inserted = 0;
      for (const it of items) {
        const estado = it.f_ven < todayISO ? "vencido" : "ok";
        await conn.query(insLote, [
          it.id, it.lote, it.f_ven, it.cantidad, it.proveedor || null, estado,
        ]);
        await conn.query(insGEI, [it.id, it.lote, it.f_ven, it.cantidad, it.proveedor || null]);
        inserted++;
      }

      /* 3) Refrescar agregados 'cantidad' y 'proximo_venc' en 'medicamento' */
      const chunk = 500;
      for (let i = 0; i < meds.length; i += chunk) {
        const slice = meds.slice(i, i + chunk);
        const placeholders = slice.map(() => "?").join(",");
        await conn.query(
          `
          UPDATE medicamento m
          LEFT JOIN (
            SELECT
              medicamento_id,
              SUM(cantidad) AS stock_total,
              MIN(CASE WHEN estado='ok' THEN f_ven END) AS prox
            FROM medicamento_lote
            WHERE medicamento_id IN (${placeholders})
            GROUP BY medicamento_id
          ) s ON s.medicamento_id = m.id
          SET m.cantidad = COALESCE(s.stock_total, 0),
              m.proximo_venc = s.prox
          `,
          slice
        );
      }

      await conn.commit();
      res.json({
        ok: true,
        rows_total: rows.length,
        grouped_rows: items.length,
        inserted,
        skipped,
        affected_meds: meds.length,
      });
    } catch (e) {
      await conn.rollback();
      console.error("POST /api/inventario/import rollback:", e.sqlMessage || e.message, e.sql || "");
      res.status(500).json({ message: "Error importando archivo" });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error("POST /api/inventario/import error:", e.message);
    res.status(500).json({ message: "Error importando" });
  }
});

export default router;
