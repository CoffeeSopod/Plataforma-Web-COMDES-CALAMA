// src/lib/chat.handlers.js
// Chat en tiempo real con Socket.IO y MySQL (mysql2/promise)
// IDs de usuario son RUT (cadenas). Incluye presencia, unread, typing, etc.

const online = new Map(); // userId(string) -> conexiones activas

export default function chatHandlers(io, socket, pool) {
  const userId = String(socket.user.id ?? "").trim();
  if (!userId) {
    socket.disconnect(true);
    return;
  }

  // ===== Presencia =====
  const count = (online.get(userId) || 0) + 1;
  online.set(userId, count);

  socket.join(`user:${userId}`);
  // Estado inicial de presencia
  socket.emit("presence:bulk", Array.from(online.keys()));
  // Aviso global de que este user está online
  io.emit("presence:update", { userId, status: "online" });

  socket.on("disconnect", () => {
    const left = (online.get(userId) || 1) - 1;
    if (left <= 0) {
      online.delete(userId);
      io.emit("presence:update", { userId, status: "offline" });
    } else {
      online.set(userId, left);
    }
  });

  const safeParseJSON = (v) => {
    try { return v ? JSON.parse(v) : null; } catch { return null; }
  };

  // ===== Utilitario: DM get-or-create =====
  async function getOrCreateDm(a, b) {
    a = String(a).trim();
    b = String(b).trim();

    const [rows] = await pool.query(
      `
      SELECT c.id
      FROM conversations c
      JOIN conversation_participants p1 ON p1.conversation_id = c.id AND p1.user_id = ?
      JOIN conversation_participants p2 ON p2.conversation_id = c.id AND p2.user_id = ?
      WHERE c.type = 'dm'
      LIMIT 1
      `,
      [a, b]
    );
    if (rows.length) return rows[0].id;

    const [ins] = await pool.query(`INSERT INTO conversations (type) VALUES ('dm')`);
    const convId = ins.insertId;

    await pool.query(
      `INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?), (?, ?)`,
      [convId, a, convId, b]
    );
    return convId;
  }

  // ===== Lista de conversaciones (con peer + unread) =====
  socket.on("conversations:list", async (_payload, cb) => {
    try {
      const [rows] = await pool.query(
        `
        SELECT
          c.id, c.type, c.name, c.last_message_at, c.created_at,
          p.last_read_at, p.last_read_msg_id,

          /* No leídos: mensajes posteriores a mi last_read_at y que NO son míos */
          (
            SELECT COUNT(1)
            FROM messages m
            WHERE m.conversation_id = c.id
              AND m.sender_id <> ?
              AND (p.last_read_at IS NULL OR m.created_at > p.last_read_at)
          ) AS unread_count,

          /* Datos del peer SOLO en DMs */
          IF(c.type='dm', u.rut, NULL) AS peer_id,
          IF(c.type='dm',
             CONCAT_WS(' ', u.nombres, u.apellido_paterno, u.apellido_materno),
             NULL) AS peer_name,
          IF(c.type='dm', u.nombres, NULL) AS peer_nombres,          
          IF(c.type='dm', u.apellido_paterno, NULL) AS peer_apellido, 
          IF(c.type='dm',
            CONCAT_WS(' ', u.nombres, u.apellido_paterno, u.apellido_materno),
            NULL) AS peer_name,  -- (mantén por compatibilidad, pero usaremos los nuevos)
          IF(c.type='dm', un.nombre, NULL) AS peer_unidad

        FROM conversations c
        JOIN conversation_participants p
          ON p.conversation_id = c.id AND p.user_id = ?
        LEFT JOIN conversation_participants op
          ON op.conversation_id = c.id AND op.user_id <> ? AND c.type = 'dm'
        LEFT JOIN usuario u
          ON u.rut = op.user_id
        LEFT JOIN unidad un
          ON un.id = u.id_unidad
        ORDER BY (c.last_message_at IS NULL), c.last_message_at DESC, c.created_at DESC
        LIMIT 100
        `,
        [userId, userId, userId]
      );

      cb?.(rows);
    } catch (e) {
      console.error("conversations:list error", e);
      cb?.([]);
    }
  });

  // ===== Marcar leído (alias: conversations:read y conv:markRead) =====
  async function markRead({ conversationId, lastMessageId }, cb) {
    try {
      if (!conversationId) return cb?.({ error: "conversationId requerido" });

      // Si no viene último id, usa el mayor de la conversación
      let toId = lastMessageId;
      if (!toId) {
        const [[row]] = await pool.query(
          `SELECT MAX(id) AS maxId FROM messages WHERE conversation_id = ?`,
          [conversationId]
        );
        toId = row?.maxId || null;
      }

      await pool.query(
        `UPDATE conversation_participants
           SET last_read_msg_id = ?, last_read_at = NOW()
         WHERE conversation_id = ? AND user_id = ?`,
        [toId, conversationId, userId]
      );
      cb?.({ ok: true, lastReadMsgId: toId });
    } catch (e) {
      console.error("conversations:read error", e);
      cb?.({ error: "internal" });
    }
  }
  socket.on("conversations:read", markRead);
  socket.on("conv:markRead", markRead); // compatibilidad

  // ===== DM: abrir/crear =====
  socket.on("dm:open", async ({ withUserId }, cb) => {
    try {
      const peer = String(withUserId || "").trim();
      if (!peer || peer === userId) return cb?.({ error: "withUserId inválido" });
      const convId = await getOrCreateDm(userId, peer);
      cb?.({ conversationId: convId });
    } catch (e) {
      console.error("dm:open error", e);
      cb?.({ error: "internal" });
    }
  });

  // ===== DM: enviar =====
  socket.on("dm:send", async ({ toUserId, content = "", attachments = [] }, cb) => {
    try {
      const peer = String(toUserId || "").trim();
      if (!peer || peer === userId) return cb?.({ error: "toUserId inválido" });

      const convId = await getOrCreateDm(userId, peer);
      const [res] = await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, content, attachments)
         VALUES (?, ?, ?, ?)`,
        [convId, userId, content, JSON.stringify(attachments || null)]
      );
      await pool.query(`UPDATE conversations SET last_message_at = NOW() WHERE id = ?`, [convId]);

      const msg = {
        id: res.insertId,
        conversation_id: convId,
        sender_id: userId,
        content,
        attachments,
        created_at: new Date().toISOString(),
      };

      io.to(`user:${peer}`).emit("dm:new", msg);
      io.to(`user:${userId}`).emit("dm:new", msg);
      cb?.({ ok: true, id: res.insertId });
    } catch (e) {
      console.error("dm:send error", e);
      cb?.({ error: "internal" });
    }
  });

  // ===== DM: historial =====
  socket.on("dm:history", async ({ withUserId, limit = 50, beforeId = null }, cb) => {
    try {
      const peer = String(withUserId || "").trim();
      if (!peer || peer === userId) return cb?.([]);

      const convId = await getOrCreateDm(userId, peer);

      const params = [convId];
      let q = `SELECT * FROM messages WHERE conversation_id = ? `;
      if (beforeId) { q += `AND id < ? `; params.push(beforeId); }
      q += `ORDER BY id DESC LIMIT ?`; params.push(Number(limit) || 50);

      const [rows] = await pool.query(q, params);
      const out = rows.reverse().map((r) => ({
        ...r,
        attachments: Array.isArray(r.attachments)
          ? r.attachments
          : safeParseJSON(r.attachments) || [],
        sender_id: String(r.sender_id || "").trim(),
      }));
      cb?.(out);
    } catch (e) {
      console.error("dm:history error", e);
      cb?.([]);
    }
  });

  // ===== Rooms: crear =====
  socket.on("room:create", async ({ name, memberIds = [] }, cb) => {
    try {
      if (!name) return cb?.({ error: "Nombre requerido" });

      const ids = Array.from(
        new Set([userId, ...memberIds.map((x) => String(x || "").trim())])
      ).filter(Boolean);

      const [ins] = await pool.query(
        `INSERT INTO conversations (type, name, owner_id) VALUES ('room', ?, ?)`,
        [name, userId]
      );
      const convId = ins.insertId;

      const values = ids.map(() => "(?, ?)").join(",");
      const params = ids.flatMap((uid) => [convId, uid]);
      await pool.query(
        `INSERT INTO conversation_participants (conversation_id, user_id) VALUES ${values}`,
        params
      );

      cb?.({ conversationId: convId });
      ids.forEach((uid) =>
        io.to(`user:${uid}`).emit("room:created", { conversationId: convId, name })
      );
    } catch (e) {
      console.error("room:create error", e);
      cb?.({ error: "internal" });
    }
  });

  // ===== Rooms: enviar =====
  socket.on("room:send", async ({ conversationId, content = "", attachments = [] }, cb) => {
    try {
      if (!conversationId) return cb?.({ error: "conversationId requerido" });

      const [[isMember]] = await pool.query(
        `SELECT 1 AS ok FROM conversation_participants WHERE conversation_id = ? AND user_id = ? LIMIT 1`,
        [conversationId, userId]
      );
      if (!isMember?.ok) return cb?.({ error: "forbidden" });

      const [res] = await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, content, attachments)
         VALUES (?, ?, ?, ?)`,
        [conversationId, userId, content, JSON.stringify(attachments || null)]
      );
      await pool.query(`UPDATE conversations SET last_message_at = NOW() WHERE id = ?`, [conversationId]);

      const msg = {
        id: res.insertId,
        conversation_id: conversationId,
        sender_id: userId,
        content,
        attachments,
        created_at: new Date().toISOString(),
      };

      const [members] = await pool.query(
        `SELECT user_id FROM conversation_participants WHERE conversation_id = ?`,
        [conversationId]
      );
      members.forEach((m) =>
        io.to(`user:${String(m.user_id).trim()}`).emit("room:new", msg)
      );

      cb?.({ ok: true, id: res.insertId });
    } catch (e) {
      console.error("room:send error", e);
      cb?.({ error: "internal" });
    }
  });

  // ===== Rooms: historial =====
  socket.on("room:history", async ({ conversationId, limit = 50, beforeId = null }, cb) => {
    try {
      if (!conversationId) return cb?.([]);

      const [[isMember]] = await pool.query(
        `SELECT 1 AS ok FROM conversation_participants WHERE conversation_id = ? AND user_id = ? LIMIT 1`,
        [conversationId, userId]
      );
      if (!isMember?.ok) return cb?.([]);

      const params = [conversationId];
      let q = `SELECT * FROM messages WHERE conversation_id = ? `;
      if (beforeId) { q += `AND id < ? `; params.push(beforeId); }
      q += `ORDER BY id DESC LIMIT ?`; params.push(Number(limit) || 50);

      const [rows] = await pool.query(q, params);
      const out = rows.reverse().map((r) => ({
        ...r,
        attachments: Array.isArray(r.attachments)
          ? r.attachments
          : safeParseJSON(r.attachments) || [],
        sender_id: String(r.sender_id || "").trim(),
      }));
      cb?.(out);
    } catch (e) {
      console.error("room:history error", e);
      cb?.([]);
    }
  });

  // ===== Typing (opcional) =====
  socket.on("typing", ({ conversationId, toUserId }) => {
    const peer = String(toUserId || "").trim();
    if (peer) io.to(`user:${peer}`).emit("typing", { from: userId, conversationId });
  });
}
