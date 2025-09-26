// src/chat/ChatWidget.jsx
import React, { useEffect, useRef, useState } from "react";
import { useChat } from "./ChatProvider";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessage, faMagnifyingGlass, faArrowLeft, faPaperPlane, faPaperclip, faFaceLaughWink} from "@fortawesome/free-solid-svg-icons";
import 'emoji-picker-element';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const { globalUnread } = useChat();
  return (
    <>
      <button
        className={`chat-fab ${open ? "is-open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Abrir chat"
      >
        <FontAwesomeIcon icon={faMessage}/>
        {globalUnread > 0 && <span className="chat-fab__badge">{globalUnread}</span>}
      </button>

      {/* panel siempre montado para animación de salida */}
      <ChatPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function ChatPanel({ open, onClose }) {
  const { conversations, setActiveConversationId } = useChat();
  const [tab, setTab] = useState("list"); // list | search | newroom
  const [active, setActive] = useState(null); // {conversationId, title, peer?}

  // informar al provider qué conversación está activa
  useEffect(() => {
    setActiveConversationId(active?.conversationId || null);
  }, [active, setActiveConversationId]);

  return (
    <div className={`chat-panel ${open ? "is-open" : ""}`}>

      <header className="chat-panel__head chat-head-brand">
        <img src="/assets/images/intranet/logo_chat.png" alt="Chat COMDES" className="chat-logo" />
        <span className="spacer" />
        <button onClick={onClose} aria-label="Cerrar">✕</button>
      </header>

      <div className="chat-panel__body">
        {active ? (
          <ConversationView
            active={active}
            onBack={() => setActive(null)}
          />
        ) : tab === "list" ? (
          <ConvoList
            list={conversations}
            onOpen={(c) =>
              setActive({
                conversationId: c.id,
                title: c._title,       // lo armamos en ConvoList
                peer: c._peer || null, // para DM
              })
            }
          />
        ) : tab === "search" ? (
          <UserSearch
            onOpenDM={(convId, user) => {
              setActive({
                conversationId: convId,
                title: user?.name || "Mensaje directo",
                peer: user,
              });
              setTab("list");
            }}
          />
        ) : (
          <NewRoom
            onCreated={(convId, name) =>
              setActive({ conversationId: convId, title: name || "Grupo" })
            }
          />
        )}
      </div>
    </div>
  );
}

/* ---------- Lista de conversaciones (nueva UI) ---------- */
/* ---------- Lista de conversaciones (fusiona búsqueda local + remota) ---------- */
function ConvoList({ list, onOpen }) {
  const { presence, openDm } = useChat();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [remoteUsers, setRemoteUsers] = useState([]); // resultados del backend

  // Mapa rápido de peers que ya tienen conversación (para NO duplicar en "Colegas")
  const dmPeerIds = new Set(
    (list || [])
      .filter((c) => c.type === "dm" && c.peer_id)
      .map((c) => String(c.peer_id))
  );

  // Filtrado local de conversaciones (Rooms + DMs)
  const filteredConvos = (list || []).filter((c) => {
    const isDM = c.type === "dm";
    const displayName = isDM
      ? (c.peer_nombres && c.peer_apellido)
        ? `${String(c.peer_nombres).split(" ")[0]} ${c.peer_apellido}`
        : (c.peer_name || "Mensaje directo")
      : (c.name || "Grupo");
    return displayName.toLowerCase().includes(q.trim().toLowerCase());
  });

  // Búsqueda remota de usuarios de la BD (solo cuando hay query suficiente)
  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setRemoteUsers([]);
      setLoading(false);
      setErr("");
      return;
    }

    const t = setTimeout(async () => {
      const token = localStorage.getItem("token") || "";
      setLoading(true);
      setErr("");
      try {
        const r = await fetch(`/api/chat/users/search?query=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) {
          setErr(`Error ${r.status}`);
          setRemoteUsers([]);
        } else {
          const data = await r.json();
          // data = [{ id: rut, name, email }]
          setRemoteUsers(Array.isArray(data) ? data : []);
          if (!Array.isArray(data)) setErr("Respuesta inesperada del servidor.");
        }
      } catch {
        setErr("No se pudo contactar al servidor.");
        setRemoteUsers([]);
      } finally {
        setLoading(false);
      }
    }, 300); // debounce 300ms

    return () => clearTimeout(t);
  }, [q]);

  // Helper: avatar initials (primer nombre + primer apellido del "name" que trae el endpoint)
  const initialsFromName = (fullName) => {
    const parts = String(fullName || "").trim().split(/\s+/);
    const first = parts[0] || "";
    const last  = parts.length > 1 ? parts[1] : "";
    return `${first.slice(0,1)}${last.slice(0,1)}`.toUpperCase() || "U";
  };

  // Al click en un resultado remoto: abrir/crear DM y navegar
  const startRemoteDm = async (u) => {
    try {
      const { conversationId, error } = await openDm(u.id);
      if (error || !conversationId) return console.error("dm:open error", error);
      // El displayName ideal: primer nombre + apellido paterno si lo tienes;
      // como el endpoint devuelve "name" completo, usamos nombre + primer apellido como aproximación visual.
      const displayName = (() => {
        const n = String(u.name || "").trim().split(/\s+/);
        const fn = n[0] || "";
        const ln = n.length > 1 ? n[1] : "";
        return `${fn} ${ln}`.trim();
      })();
      onOpen({
        id: conversationId,
        _title: displayName,
        _peer: { id: u.id, name: displayName },
        type: "dm",
      });
    } catch (e) {
      console.error("dm:open fail", e);
    }
  };

  return (
    <div className="convo-shell">
      <div className="chat-search">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="search-ico" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar colegas…"
          aria-label="Buscar"
        />
      </div>

      {/* Mensajitos de estado */}
      {loading && <div className="muted" style={{ paddingLeft: 4 }}>Buscando…</div>}
      {!!err && <div className="muted" style={{ color: "#ef4444", paddingLeft: 4 }}>{err}</div>}

      <ul className="convo-modern">
        {/* Sección: Tus chats */}
        {(filteredConvos.length > 0) && (
          <li className="convo-section-title">Tus chats</li>
        )}
        {filteredConvos.map((c) => {
          const isDM = c.type === "dm";

          // Nombre: primer nombre + apellido paterno (si viene desglosado desde backend)
          const displayName = isDM
            ? (c.peer_nombres && c.peer_apellido)
              ? `${String(c.peer_nombres).split(" ")[0]} ${c.peer_apellido}`
              : (c.peer_name || "Mensaje directo")
            : (c.name || "Grupo");

          // Iniciales para círculo
          const initials = isDM
            ? (() => {
                const first = (c.peer_nombres || "").trim().split(/\s+/)[0] || "";
                const last  = (c.peer_apellido || "").trim().split(/\s+/)[0] || "";
                return `${first.slice(0,1)}${last.slice(0,1)}`.toUpperCase() || "U";
              })()
            : "GR";

          const online = isDM && c.peer_id ? presence[c.peer_id] === "online" : false;
          const unread = Number(c.unread_count || 0);
          const unidad = isDM ? (c.peer_unidad || "") : "";

          return (
            <li
              key={`local-${c.id}`}
              className="user-row"
              onClick={() =>
                onOpen({
                  ...c,
                  _title: displayName,
                  _peer: isDM
                    ? { id: c.peer_id, name: displayName, unidad: c.peer_unidad || "" }
                    : null,
                })
              }
            >
              <div className="user-left">
                <span className={`presence ${online ? "on" : ""}`} aria-hidden />
                <div className="avatar"><span className="avatar-initials">{initials}</span></div>
              </div>
              <div className="user-main">
                <div className="user-name" title={displayName}>{displayName}</div>
                {unidad && <div className="user-badge">{unidad}</div>}
              </div>
              <div className="user-right">
                {unread > 0 && <span className="unread">{unread}</span>}
              </div>
            </li>
          );
        })}

        {/* Sección: Colegas (resultados remotos que NO tienen chat aún) */}
        {(() => {
          const candidates = (remoteUsers || []).filter((u) => !dmPeerIds.has(String(u.id)));
          if (candidates.length === 0) return null;
          return (
            <>
              <li className="convo-section-title">Colegas</li>
              {candidates.map((u) => {
                const initials = initialsFromName(u.name);
                const online = presence[String(u.id)] === "online"; // si coincide con RUT y presencia
                return (
                  <li
                    key={`remote-${u.id}`}
                    className="user-row"
                    onClick={() => startRemoteDm(u)}
                    title={`Chatear con ${u.name}`}
                  >
                    <div className="user-left">
                      <span className={`presence ${online ? "on" : ""}`} aria-hidden />
                      <div className="avatar"><span className="avatar-initials">{initials}</span></div>
                    </div>
                    <div className="user-main">
                      <div className="user-name" title={u.name}>{u.name}</div>
                      {u.email && <div className="user-badge">{u.email}</div>}
                    </div>
                    <div className="user-right">{/* sin unread en nuevos */}</div>
                  </li>
                );
              })}
            </>
          );
        })()}
      </ul>

      {/* Vacío absoluto (sin chats y sin resultados) */}
      {(!loading && !err && filteredConvos.length === 0 && q.trim().length < 2) && (
        <div className="empty">Aún no tienes conversaciones.</div>
      )}
      {(!loading && !err && filteredConvos.length === 0 && q.trim().length >= 2 && remoteUsers.length === 0) && (
        <div className="empty">Sin resultados para “{q}”.</div>
      )}
    </div>
  );
}


/* ---------- Buscar usuarios ---------- */
function UserSearch({ onOpenDM }) {
  const { openDm } = useChat();
  const [q, setQ] = useState("");
  const [res, setRes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const t = setTimeout(async () => {
      const query = q.trim();
      if (!query) { setRes([]); setErr(""); return; }

      setLoading(true); setErr("");
      try {
        const token = localStorage.getItem("token") || "";
        const r = await fetch(`/api/chat/users/search?query=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) { setErr(`Error ${r.status}`); setRes([]); return; }
        const data = await r.json();
        setRes(Array.isArray(data) ? data : []);
        if (!Array.isArray(data)) setErr("Respuesta inesperada del servidor.");
      } catch {
        setErr("No se pudo contactar al servidor.");
        setRes([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const startDm = async (u) => {
    try {
      const { conversationId, error } = await openDm(u.id);
      if (!conversationId || error) return console.error("dm:open error", error);
      onOpenDM(conversationId, u);
    } catch (e) { console.error("dm:open fail", e); }
  };

  return (
    <div className="search">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar usuarios…" />
      {loading && <div className="muted" style={{ marginTop: 8 }}>Buscando…</div>}
      {err && <div className="muted" style={{ color: "#ef4444", marginTop: 8 }}>{err}</div>}
      <ul>
        {(Array.isArray(res) ? res : []).map((u) => (
          <li key={u.id} onClick={() => startDm(u)}>
            {u.name} <span className="muted">({u.email})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Nuevo grupo ---------- */
function NewRoom({ onCreated }) {
  const { createRoom } = useChat();
  const [name, setName] = useState("");
  const [members] = useState([]); // TODO: multi-select si lo necesitas

  const create = async () => {
    const { conversationId, error } = await createRoom(name, members);
    if (error) return console.error("room:create error", error);
    if (conversationId) onCreated(conversationId, name);
  };

  return (
    <div className="newroom">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del grupo" />
      <button onClick={create} disabled={!name}>Crear</button>
    </div>
  );
}

/* ---------- Conversación (DM/Room) NUEVA UI ---------- */
function ConversationView({ active, onBack }) {
  const {
    meId,
    historyByConversation,
    sendToConversation,
    socket,
    typingMap,
    notifyTyping,
    markRead,
    presence,
  } = useChat();

  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [swap, setSwap] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const endRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const pickerRef = useRef(null);              
  const lastTypingSent = useRef(0);

  const peer = active.peer || null;
  const isOnline = peer?.id ? presence[peer.id] === "online" : false;

  const initials = (() => {
    const n = (peer?.name || active.title || "").trim().split(/\s+/);
    const first = n[0] || "";
    const last  = n.length > 1 ? n[1] : "";
    return `${first.slice(0,1)}${last.slice(0,1)}`.toUpperCase() || "U";
  })();

  useEffect(() => {
    setSwap(true);
    const t = setTimeout(() => setSwap(false), 220);
    return () => clearTimeout(t);
  }, [active.conversationId]);

  // 👉 emojis — inserta en el cursor (la ponemos ANTES del useEffect que la usa)
  const insertAtCaret = (emoji) => {
    const el = inputRef.current;
    if (!el) { setText((t) => t + emoji); return; }
    const start = el.selectionStart ?? text.length;
    const end   = el.selectionEnd ?? text.length;
    const next  = text.slice(0, start) + emoji + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  // Conectar evento del web component emoji-picker
  useEffect(() => {
    if (!showPicker || !pickerRef.current) return;
    const el = pickerRef.current;
    const onPick = (e) => insertAtCaret(e.detail.unicode);
    el.addEventListener('emoji-click', onPick);
    return () => el.removeEventListener('emoji-click', onPick);
  }, [showPicker, insertAtCaret]);

  // Historial + subscripción
  useEffect(() => {
    let mounted = true;
    (async () => {
      const h = await historyByConversation(active.conversationId, 50);
      const arr = Array.isArray(h) ? h : [];
      if (!mounted) return;
      setMsgs(arr);
      const last = arr[arr.length - 1];
      if (last && last.sender_id !== meId) {
        await markRead(active.conversationId, last.id);
      }
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    })();

    if (!socket) return () => { mounted = false; };

    const onNew = async (m) => {
      if (m.conversation_id === active.conversationId) {
        setMsgs((prev) => [...prev, m]);
        if (m.sender_id !== meId) await markRead(active.conversationId, m.id);
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
      }
    };
    socket.on("dm:new", onNew);
    socket.on("room:new", onNew);

    return () => {
      mounted = false;
      socket.off("dm:new", onNew);
      socket.off("room:new", onNew);
    };
  }, [active.conversationId, historyByConversation, markRead, meId, socket]);

  const send = () => {
    const content = text.trim();
    if (!content) return;
    sendToConversation(active.conversationId, { content });
    setText("");
    setShowPicker(false);
  };

  const onType = (e) => {
    setText(e.target.value);
    const now = Date.now();
    if (now - lastTypingSent.current > 1200) {
      notifyTyping(active.conversationId, active.peer?.id);
      lastTypingSent.current = now;
    }
  };

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const r = await fetch("/api/chat/upload", { method: "POST", body: form }).then((x) => x.json());
    if (r?.url) sendToConversation(active.conversationId, { attachments: [r] });
    e.target.value = "";
  };

  const typingEntry = typingMap[active.conversationId];
  const showTyping = typingEntry && typingEntry.from !== meId;

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="conv">
      <div className="conv-head conv-head--dm">
        <button className="btn-ghost" onClick={onBack} aria-label="Volver">
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>

        <div className="conv-peer">
          <div className="avatar-lg">
            <span className={`presence ${isOnline ? "on" : ""}`} aria-hidden />
            <span className="avatar-initials">{initials}</span>
          </div>
          <div className="conv-peer-meta">
            <div className="conv-peer-name" title={peer?.name || active.title}>
              {peer?.name || active.title}
            </div>

            {active?.peer?.unidad && (
              <div className="user-badge">{active.peer.unidad}</div>
            )}
          </div>
        </div>

        <span className="spacer" />
      </div>

      <div className={`conv-msgs ${swap ? "swap-in" : ""}`}>
        {msgs.map((m) => (
          <div key={m.id} className={`msg ${m.sender_id === meId ? "out" : "in"}`}>
            {m.attachments?.length
              ? m.attachments.map((a, i) =>
                  a.mime?.startsWith("image/")
                    ? <img key={i} src={a.url} alt="" className="msg-img" />
                    : <a key={i} href={a.url} target="_blank" rel="noreferrer">Archivo</a>
                )
              : <span className="msg-text">{m.content}</span>
            }
          </div>
        ))}
        {showTyping && <TypingIndicator />}
        <div ref={endRef} />
      </div>

      <div className="conv-input conv-input--modern">
        <div className="input-left">
          <button
            className="icon-btn-emoji"
            title="Emoji"
            aria-label="Insertar emoji"
            onClick={() => setShowPicker((v) => !v)}
          >
            <FontAwesomeIcon icon={faFaceLaughWink} />
          </button>

          {showPicker && (
            <div className="emoji-pop">
              <emoji-picker
                ref={pickerRef}
                className="emoji-wc"   
                locale="es"
                skin-tone-emoji="👍"
              ></emoji-picker>
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          value={text}
          onChange={onType}
          onKeyDown={onKeyDown}
          placeholder="Escribe un mensaje…"
        />

        <div className="input-actions">
          <input ref={fileRef} type="file" hidden onChange={onUpload} />
          <button
            className="icon-btn-file"
            title="Adjuntar archivo"
            aria-label="Adjuntar archivo"
            onClick={() => fileRef.current?.click()}
          >
            <FontAwesomeIcon icon={faPaperclip} />
          </button>

          <button className="send-btn" onClick={send} title="Enviar" aria-label="Enviar">
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </div>
      </div>
    </div>
  );
}



/* ---------- UI: typing ---------- */
function TypingIndicator() {
  return (
    <div className="typing" aria-live="polite" aria-label="Escribiendo…">
      <span className="dot-typing" />
      <span className="dot-typing" />
      <span className="dot-typing" />
    </div>
  );
}
