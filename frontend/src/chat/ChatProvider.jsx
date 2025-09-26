// src/chat/ChatProvider.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import { getUser } from "../auth/auth";

// URL del backend (sin Vite). Usa REACT_APP_API_URL si existe.
const API_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:4000"
    : `http://${window.location.hostname}:4000`);

const ChatCtx = createContext(null);
export const useChat = () => useContext(ChatCtx);

// decode JWT por si no obtienes el id desde getUser()
function decodeJwt(token) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload));
  } catch (_e) {
    return {};
  }
}

export default function ChatProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [presence, setPresence] = useState({}); // { userId: 'online' | 'offline' }
  const [typingMap, setTypingMap] = useState({}); // { [conversationId]: { from, at } }
  const [connected, setConnected] = useState(false);

  // Indicadores globales
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [globalUnread, setGlobalUnread] = useState(0);
  const baseTitleRef = useRef(document.title);
  const dingRef = useRef(null);

  const token = localStorage.getItem("token") || "";
  const meFromAuth = (typeof getUser === "function" ? getUser() : null) || {};
  const meId =
    meFromAuth?.id ||
    decodeJwt(token).sub ||
    decodeJwt(token).id ||
    decodeJwt(token).userId;

  // === Conectar Socket.IO
  useEffect(() => {
    if (!token) return;

    const s = io(API_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"], // añade polling por compat
      withCredentials: true,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    setSocket(s);

    // preparar sonido (coloca el archivo en public/sound/mensaje_nuevo.wav)
    try {
      const a = new Audio("/sound/mensaje_nuevo.wav");
      a.preload = "auto";
      a.volume = 1.0;
      dingRef.current = a;
    } catch (_e) {
      dingRef.current = null;
    }

    const refresh = () => {
      s.emit("conversations:list", null, (rows) => setConversations(rows || []));
    };

    s.on("connect", () => {
      setConnected(true);
      refresh();
    });
    s.on("disconnect", () => setConnected(false));
    s.on("connect_error", (err) =>
      console.error("[Chat] connect_error:", err?.message || err)
    );

    // Nuevos mensajes: refrescar lista + sonar si aplica
    const onAnyNew = (m) => {
      refresh();
      try {
        const fromOther = String(m?.sender_id || "") !== String(meId || "");
        const otherChat =
          String(m?.conversation_id || "") !== String(activeConversationId || "");
        if (fromOther && (document.hidden || otherChat)) {
          if (dingRef.current) {
            dingRef.current.play().catch(() => {});
          }
        }
      } catch (_e) {}
    };
    s.on("dm:new", onAnyNew);
    s.on("room:new", onAnyNew);
    s.on("room:created", refresh);

    // Presencia
    s.on("presence:bulk", (ids = []) => {
      setPresence((prev) => {
        const next = { ...prev };
        ids.forEach((id) => {
          next[id] = "online";
        });
        return next;
      });
    });
    s.on("presence:update", ({ userId, status }) =>
      setPresence((p) => ({ ...p, [userId]: status }))
    );

    // Typing indicator
    const onTyping = ({ from, conversationId }) => {
      setTypingMap((prev) => ({
        ...prev,
        [conversationId]: { from, at: Date.now() },
      }));
      // Limpieza si no se renueva en ~2.5s
      setTimeout(() => {
        setTypingMap((prev) => {
          const entry = prev[conversationId];
          if (!entry) return prev;
          if (Date.now() - entry.at > 2200) {
            const copy = { ...prev };
            delete copy[conversationId];
            return copy;
          }
          return prev;
        });
      }, 2500);
    };
    s.on("typing", onTyping);

    // Cleanup
    return () => {
      s.off("dm:new", onAnyNew);
      s.off("room:new", onAnyNew);
      s.off("room:created", refresh);
      s.off("presence:bulk");
      s.off("presence:update");
      s.off("typing", onTyping);
      s.disconnect();
    };
  }, [token, meId, activeConversationId]);

  // Recalcular no leídos globales y actualizar título de la pestaña
  useEffect(() => {
    const total = (conversations || []).reduce(
      (acc, c) => acc + Number(c.unread_count || 0),
      0
    );
    setGlobalUnread(total);
  }, [conversations]);

  useEffect(() => {
    if (globalUnread > 0) {
      document.title = `NUEVO MENSAJE (${globalUnread}) — ${baseTitleRef.current}`;
    } else {
      document.title = baseTitleRef.current;
    }
  }, [globalUnread]);

  // (Opcional) Mantener last_seen con tu endpoint de heartbeat
  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => {
      fetch("/api/auth/heartbeat", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }, 60_000);
    return () => clearInterval(id);
  }, [token]);

  // Helpers expuestos al resto del front
  const api = useMemo(
    () => ({
      socket,
      connected,
      meId,
      conversations, // incluye: peer_id, peer_name, peer_unidad, unread_count
      presence,
      typingMap,

      // Indicadores globales
      globalUnread,
      activeConversationId,
      setActiveConversationId,

      refreshConversations: () => {
        if (!socket) return;
        socket.emit("conversations:list", null, (rows) =>
          setConversations(rows || [])
        );
      },

      /**
       * Historial por conversación.
       * - Rooms: historyByConversation(convId, limit, beforeId)
       * - DMs:   historyByConversation(convId, limit, beforeId, peerId)
       */
      historyByConversation: (conversationId, limit = 50, beforeId, peerId) =>
        new Promise((res) => {
          if (!socket) return res([]);
          if (peerId) {
            // DM
            socket.emit(
              "dm:history",
              { withUserId: peerId, limit, beforeId },
              res
            );
          } else {
            // Room
            socket.emit(
              "room:history",
              { conversationId, limit, beforeId },
              res
            );
          }
        }),

      /**
       * Enviar mensaje.
       * - Rooms: sendToConversation(convId, { content, attachments })
       * - DMs:   sendToConversation(convId, { content, attachments }, peerId)
       */
      sendToConversation: (conversationId, payload, peerId) => {
        if (!socket) return;
        if (peerId) {
          const { content = "", attachments = [] } = payload || {};
          socket.emit("dm:send", { toUserId: peerId, content, attachments });
        } else {
          socket.emit("room:send", { conversationId, ...payload });
        }
      },

      // Crear grupo
      createRoom: (name, memberIds = []) =>
        new Promise((res) => {
          if (!socket) return res({ error: "no_socket" });
          socket.emit("room:create", { name, memberIds }, res);
        }),

      // Abrir/crear DM → devuelve { conversationId }
      openDm: (withUserId) =>
        new Promise((res) => {
          if (!socket) return res({ error: "no_socket" });
          socket.emit("dm:open", { withUserId }, res);
        }),

      // Marcar leído (también actualiza localmente unread_count = 0)
      markRead: (conversationId, lastMessageId) =>
        new Promise((res) => {
          if (!socket) {
            // simula éxito para no romper UX si aún no hay socket
            setConversations((list) =>
              (list || []).map((c) =>
                c.id === conversationId ? { ...c, unread_count: 0 } : c
              )
            );
            return res({ ok: true });
          }
          socket.emit(
            "conversations:read",
            { conversationId, lastMessageId },
            (r) => {
              setConversations((list) =>
                (list || []).map((c) =>
                  c.id === conversationId ? { ...c, unread_count: 0 } : c
                )
              );
              res(r);
            }
          );
        }),

      // Avisar "estoy escribiendo"
      notifyTyping: (conversationId, toUserId) => {
        if (!socket) return;
        socket.emit("typing", { conversationId, toUserId });
      },
    }),
    [
      socket,
      connected,
      meId,
      conversations,
      presence,
      typingMap,
      activeConversationId,
      globalUnread,
    ]
  );

  return <ChatCtx.Provider value={api}>{children}</ChatCtx.Provider>;
}
