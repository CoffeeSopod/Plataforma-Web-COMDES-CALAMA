// src/routes/contactos.js
import { Router } from "express";
import { pool } from "../lib/db.js";

const router = Router();

/** Listado de unidades (para armar footer o índice) */
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, slug, nombre, icono_fa, bg_url, descripcion
       FROM contacto_unidad
       WHERE activo = 1
       ORDER BY nombre ASC`
    );
    res.json(rows);
  } catch (e) {
    console.error("GET /api/contactos error:", e);
    res.status(500).json({ message: "Error listando unidades" });
  }
});

/** Detalle de una unidad por slug:
 *  { unidad, encargado: {...}|null, equipo: [...] }
 */
router.get("/:slug", async (req, res) => {
  try {
    const slug = String(req.params.slug || "").trim();
    const [[unidad]] = await pool.query(
      `SELECT id, slug, nombre, icono_fa, bg_url, descripcion
       FROM contacto_unidad
       WHERE slug = ? AND activo = 1
       LIMIT 1`,
      [slug]
    );
    if (!unidad) return res.status(404).json({ message: "Unidad no encontrada" });

    // Traer miembros (incluye si hay 'lead' y 'member'), luego separamos en Node
    const [miembros] = await pool.query(
      `SELECT
          m.rol, m.orden,
          p.id, p.nombre, p.cargo, p.email, p.telefono, p.avatar_url
       FROM contacto_unidad_miembro m
       JOIN contacto_persona p ON p.id = m.persona_id
       WHERE m.unidad_id = ? AND p.activo = 1
       ORDER BY (m.rol='lead') DESC, m.orden ASC, p.nombre ASC`,
      [unidad.id]
    );

    const encargado = miembros.find(x => x.rol === "lead") || null;
    const equipo = miembros.filter(x => x.rol === "member");

    res.json({ unidad, encargado, equipo });
  } catch (e) {
    console.error("GET /api/contactos/:slug error:", e);
    res.status(500).json({ message: "Error cargando unidad" });
  }
});

export default router;
