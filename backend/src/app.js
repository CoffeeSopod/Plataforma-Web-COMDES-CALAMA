// app.js (backend) — versión limpia lista para LAN
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import http from "http";
import { Server as IOServer } from "socket.io";
import jwt from "jsonwebtoken";
import multer from "multer";
import { fileURLToPath } from "url";

import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import lookupsRouter from "./routes/lookups.js";
import pacientesRouter from "./routes/paciente.js";
import shortcutsRoutes from "./routes/shortcuts.js";
import centrosRouter from "./routes/centros.js";
import inventarioRoutes from "./routes/inventario.js";
import guiaEntradaRouter from "./routes/guiaEntrada.js";
import medicamentosRouter from "./routes/medicamentos.js";
import catalogosRouter from "./routes/catalogos.js";
import boletasRouter from "./routes/boletas.js";
import contactos from "./routes/contactos.js";
import bannersRouter from './routes/banners.js';


import { pool } from "./lib/db.js";
import chatHandlers from "./lib/chat.handlers.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1); // útil si algún día hay proxy/reverse-proxy

/* ========= Paths robustos ========= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ========= CORS =========
   FRONTEND_ORIGINS admite coma: "http://localhost:3000,http://192.168.2.16:3000"
*/
const envOrigins = (process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN || "http://localhost:3000")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

// Añadimos 127.0.0.1 por conveniencia
if (!envOrigins.includes("http://127.0.0.1:3000")) {
  envOrigins.push("http://127.0.0.1:3000");
}

app.use(
  cors({
    origin(origin, cb) {
      // Permite same-origin / curl (sin header Origin) y los orígenes permitidos
      if (!origin || envOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));

/* ========= Rutas simples ========= */
app.get("/api/health", (_req, res) => res.json({ ok: true }));

/* ========= Rutas de tu API ========= */
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/lookups", lookupsRouter);
app.use("/api/pacientes", pacientesRouter);
app.use("/api/shortcuts", shortcutsRoutes);
app.use("/api", centrosRouter);            // /api/centros/*
app.use("/api/contactos", contactos);
app.use("/api/guia-entrada", guiaEntradaRouter);
app.use("/api/medicamentos", medicamentosRouter);
app.use("/api/catalogos", catalogosRouter);
app.use("/api", inventarioRoutes);
app.use("/api/boletas", boletasRouter);
app.use('/api/banners', bannersRouter);
/* ========= Estáticos (uploads) ========= */
const uploadsDir = path.resolve(__dirname, "uploads");
app.use("/uploads", express.static(uploadsDir));

/* ========= Upload adjuntos chat ========= */
const upload = multer({
  dest: path.join(uploadsDir, "chat"),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});
app.post("/api/chat/upload", upload.single("file"), (req, res) => {
  const { mimetype, size, filename } = req.file || {};
  if (!filename) return res.status(400).json({ error: "Archivo requerido" });
  res.json({ url: `/uploads/chat/${filename}`, mime: mimetype, size });
});

/* ========= Ping DB ========= */
app.get("/api/db/ping", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.json(rows[0]); // { ok: 1 }
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "DB error" });
  }
});

/* ========= Búsqueda usuarios (chat) con JWT ========= */
app.get("/api/chat/users/search", async (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json([]);

    jwt.verify(token, process.env.JWT_SECRET || "devsecret");

    const q = String(req.query.query || "").trim();
    const limit = Math.min(parseInt(req.query.limit || "20", 10) || 20, 50);
    if (!q) return res.json([]);

    const [rows] = await pool.query(
      `SELECT 
         rut AS id,
         CONCAT_WS(' ', nombres, apellido_paterno, apellido_materno) AS name,
         correo AS email
       FROM usuario
       WHERE
         LOWER(nombres) LIKE LOWER(?) OR
         LOWER(apellido_paterno) LIKE LOWER(?) OR
         LOWER(apellido_materno) LIKE LOWER(?) OR
         LOWER(correo) LIKE LOWER(?)
       ORDER BY nombres
       LIMIT ?`,
      [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, limit]
    );

    res.json(rows);
  } catch (e) {
    console.error("users search error", e);
    res.status(500).json([]);
  }
});

/* ========= HTTP + Socket.IO ========= */
const server = http.createServer(app);

const io = new IOServer(server, {
  cors: {
    origin: envOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
  // path: "/socket.io", // por defecto ya es /socket.io
});

// Autenticación del socket con el MISMO JWT
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");
    if (!token) return next(new Error("No token"));

    const payload = jwt.verify(token, process.env.JWT_SECRET || "devsecret");
    const id = payload.sub ?? payload.id ?? payload.userId;
    if (!id) return next(new Error("Token inválido"));
    socket.user = { id, name: payload.name || payload.nombre || "" };
    next();
  } catch (e) {
    next(e);
  }
});

io.on("connection", (socket) => chatHandlers(io, socket, pool));

io.engine.on("connection_error", (err) => {
  console.error("WS connection_error:", {
    code: err.code,
    message: err.message,
    context: err.context,
  });
});

/* ========= Arranque ========= */
const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`API + Socket.IO -> http://0.0.0.0:${PORT}`);
  console.log("CORS allowed origins:", envOrigins);
});
