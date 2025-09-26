// routes/banners.js
import { Router } from 'express';
import { pool } from '../lib/db.js';

const router = Router();

/* Normaliza un row para el frontend */
function mapBannerRow(row) {
  // Resolver URL de redirección:
  let href = null;
  if (row.tipo_redir === 'Enlace web' && row.redir_valor) {
    href = row.redir_valor;
  } else if (row.tipo_redir === 'Sección' && row.redir_valor) {
    // Ejemplo: puedes ajustar este patrón según tu router
    href = `/${row.redir_valor.replace(/^\/+/, '')}`;
  }

  return {
    id: row.id,
    title: row.titulo,
    subtitle: row.subtitulo,
    description: row.descripcion,        // opcional
    media: {
      type: row.tipo_media,              // 'imagen' | 'video'
      desktop: row.url_media_desktop,
      tablet: row.url_media_tablet,
      mobile: row.url_media_cell,
    },
    redirect: {
      mode: row.tipo_redir,              // 'Ninguno' | 'Sección' | 'Enlace web'
      href,                              // null si no corresponde
    },
    orden: row.orden
  };
}

/* GET: banners visibles para el carrusel */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, url_media_desktop, url_media_tablet, url_media_cell,
              titulo, subtitulo, descripcion, estado, orden,
              tipo_media, tipo_redir, redir_valor
       FROM banner_web
       WHERE estado = 'visible'
       ORDER BY orden ASC`
    );
    const data = rows.map(mapBannerRow);
    res.json({ ok: true, data });
  } catch (err) {
    console.error('GET /banners error:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener banners' });
  }
});

/* (Opcional) GET admin: listar todos */
router.get('/admin', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM banner_web ORDER BY orden ASC`
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('GET /banners/admin error:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener banners' });
  }
});

/* (Opcional) POST: crear */
router.post('/', async (req, res) => {
  try {
    const {
      url_media_desktop, url_media_tablet, url_media_cell,
      titulo, subtitulo, descripcion,
      estado = 'visible', orden,
      tipo_media = 'imagen', tipo_redir = 'Ninguno', redir_valor = null,
      id_user = null
    } = req.body || {};

    if (!url_media_desktop || !titulo || typeof orden !== 'number') {
      return res.status(400).json({ ok:false, message:'Faltan campos obligatorios' });
    }

    const [result] = await pool.query(
      `INSERT INTO banner_web
       (url_media_desktop, url_media_tablet, url_media_cell,
        titulo, subtitulo, descripcion,
        estado, orden, tipo_media, tipo_redir, redir_valor, id_user)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [url_media_desktop, url_media_tablet, url_media_cell,
       titulo, subtitulo, descripcion,
       estado, orden, tipo_media, tipo_redir, redir_valor, id_user]
    );

    res.status(201).json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error('POST /banners error:', err);
    res.status(500).json({ ok: false, message: 'Error al crear banner' });
  }
});

/* (Opcional) PATCH: actualizar parcialmente */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fields = [
      'url_media_desktop','url_media_tablet','url_media_cell',
      'titulo','subtitulo','descripcion','estado','orden',
      'tipo_media','tipo_redir','redir_valor','id_user'
    ];
    const sets = [];
    const vals = [];
    fields.forEach(f => {
      if (req.body?.[f] !== undefined) {
        sets.push(`${f} = ?`);
        vals.push(req.body[f]);
      }
    });
    if (!sets.length) return res.status(400).json({ ok:false, message:'Nada que actualizar' });

    vals.push(id);
    await pool.query(
      `UPDATE banner_web SET ${sets.join(', ')}, f_update = CURRENT_TIMESTAMP WHERE id = ?`,
      vals
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('PATCH /banners/:id error:', err);
    res.status(500).json({ ok: false, message: 'Error al actualizar banner' });
  }
});

/* (Opcional) DELETE: eliminar */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM banner_web WHERE id = ?`, [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /banners/:id error:', err);
    res.status(500).json({ ok: false, message: 'Error al eliminar banner' });
  }
});

export default router;
