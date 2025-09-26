import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMe } from "../../../../auth/useMe";
import { getToken, getUser } from "../../../../auth/auth";
import "./boletas.css";

/* Debounce simple */
function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/* Fecha actual para input datetime-local */
function nowDTLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/* Normaliza de dónde sacamos el RUT */
function pickRut(obj) {
  return obj?.rut ?? obj?.id ?? obj?.user?.rut ?? obj?.usuario?.rut ?? null;
}

/* fetch con auth: token (y en dev, cabecera x-user-rut si la guardas en localStorage) */
function authFetch(url, opts = {}) {
  const token = getToken() || "";
  const devRut = localStorage.getItem("rut") || "";
  const headers = {
    ...(opts.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(devRut ? { "x-user-rut": devRut } : {}),
  };
  return fetch(url, { ...opts, headers });
}

export default function NuevaBoleta() {
  const nav = useNavigate();
  const { me } = useMe();
  const user = getUser();              // datos “bonitos” para mostrar (nombre, unidad)
  const initialRut = pickRut(user) || ""; // RUT inicial desde localStorage

  // ===== Form principal =====
  const [f, setF] = useState({
    boleta_id: "",           // folio físico (opcional)
    id_caja: "",
    estado: "vigente",
    descripcion: "",
    f_emision: nowDTLocal(), // precargada
    id_paciente: "",
    id_usuario: initialRut,  // visible/readonly (no editable)
  });
    const vendedorDisplay = React.useMemo(() => {
    const rut =
        f.id_usuario || user?.rut || me?.rut || me?.id || "";
    const nombre =
        user?.nombre ||
        me?.nombre ||
        [me?.nombres, me?.apellido_paterno, me?.apellido_materno].filter(Boolean).join(" ") ||
        "";
    return [rut, nombre].filter(Boolean).join(" · ");
    }, [f.id_usuario, user, me]);

  // Al llegar `me`, reflejar el emisor si cambia
  useEffect(() => {
    const rutFromMe = pickRut(me);
    if (rutFromMe && rutFromMe !== f.id_usuario) {
      setF((p) => ({ ...p, id_usuario: rutFromMe }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  // Fallback: si aún no tenemos rut, pedir /api/boletas/me
  useEffect(() => {
    if (f.id_usuario) return;
    let cancel = false;
    (async () => {
      try {
        const r = await authFetch("/api/boletas/me");
        if (!r.ok) return;
        const j = await r.json();
        const rut = pickRut(j);
        if (!cancel && rut) setF((p) => ({ ...p, id_usuario: rut }));
      } catch {}
    })();
    return () => { cancel = true; };
  }, [f.id_usuario]);

  // ===== Autocomplete Pacientes =====
  const [pacQ, setPacQ] = useState("");
  const [pacList, setPacList] = useState([]);
  const [pacLoading, setPacLoading] = useState(false);
  const [pacErr, setPacErr] = useState("");
  const pacQd = useDebounced(pacQ, 250);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const q = pacQd.trim();
      if (!q) { setPacList([]); setPacErr(""); return; }

      setPacLoading(true); setPacErr("");
      try {
        const r = await authFetch(`/api/boletas/search/pacientes?q=${encodeURIComponent(q)}`);
        const j = await r.json().catch(() => []);
        if (!cancel) setPacList(Array.isArray(j) ? j : []);
      } catch {
        if (!cancel) { setPacErr("No se pudo contactar al servidor"); setPacList([]); }
      } finally {
        if (!cancel) setPacLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [pacQd]);

  // ===== Autocomplete Medicamentos =====
  const [medQ, setMedQ] = useState("");
  const [medList, setMedList] = useState([]);
  const [medLoading, setMedLoading] = useState(false);
  const [medErr, setMedErr] = useState("");
  const medQd = useDebounced(medQ, 250);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const q = medQd.trim();
      if (!q) { setMedList([]); setMedErr(""); return; }

      setMedLoading(true); setMedErr("");
      try {
        const r = await authFetch(`/api/boletas/search/medicamentos?q=${encodeURIComponent(q)}`);
        const j = await r.json().catch(() => []);
        if (!cancel) setMedList(Array.isArray(j) ? j : []);
      } catch {
        if (!cancel) { setMedErr("No se pudo contactar al servidor"); setMedList([]); }
      } finally {
        if (!cancel) setMedLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [medQd]);

  // ===== Ítems =====
  const [itemDraft, setItemDraft] = useState({
    medicamento_id: "",
    nombre: "",
    princ_act: "",
    cantidad: 1,
    precio_unit: 0,
  });
  const [items, setItems] = useState([]);

  const total = useMemo(
    () => items.reduce((a, x) => a + (Number(x.cantidad) * Number(x.precio_unit)), 0),
    [items]
  );

  const canAdd =
    !!itemDraft.medicamento_id &&
    Number(itemDraft.cantidad) > 0 &&
    Number(itemDraft.precio_unit) >= 0 &&
    Number.isFinite(Number(itemDraft.precio_unit));

  const addItem = () => {
    if (!canAdd) return;
    const d = itemDraft;
    setItems(prev => [...prev, {
      ...d,
      cantidad: Number(d.cantidad),
      precio_unit: Number(d.precio_unit),
    }]);
    setItemDraft({ medicamento_id: "", nombre: "", princ_act: "", cantidad: 1, precio_unit: 0 });
    setMedQ(""); setMedList([]);
  };

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  // ===== Submit =====
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setOk(""); setLoading(true);
    try {
      const payload = {
        id: f.boleta_id || undefined,          // opcional (folio físico)
        id_caja: f.id_caja || null,
        estado: f.estado || "vigente",
        descripcion: f.descripcion || null,
        f_emision: f.f_emision || undefined,   // si vacío, backend usa NOW
        id_paciente: f.id_paciente,
        items: items.map(x => ({
          medicamento_id: x.medicamento_id,
          cantidad: x.cantidad,
          precio_unit: x.precio_unit
        })),
      };

      const r = await authFetch("/api/boletas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.message || "Error creando boleta");

      setOk(`Boleta ${j.id} creada con éxito`);
      setTimeout(() => nav("/intranet/farmacia/boletas"), 900);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bx-shell">
      <div className="bx-header two-rows">
        <div className="bx-hl">
          <h1>Nueva boleta</h1>
          <p className="subtitle">Registra la venta de uno o más medicamentos.</p>
        </div>
        <div className="bx-hr">
          <button className="btn-ghost" onClick={() => nav(-1)}>
            <i className="fa fa-arrow-left" /> Volver
          </button>
        </div>
      </div>

      {err && <div className="alert error">{err}</div>}
      {ok && <div className="alert success">{ok}</div>}

      <form className="bx-form" onSubmit={submit}>
        {/* Cabecera */}
        <section className="card">
          <div className="card-head"><h2>Datos de la boleta</h2></div>
          <div className="card-body grid-3">
            <div className="field">
              <label>ID boleta (opcional)</label>
              <input
                value={f.boleta_id}
                onChange={(e) => setF({ ...f, boleta_id: e.target.value })}
                placeholder="Folio físico"
              />
            </div>

            <div className="field">
              <label>Fecha emisión</label>
              <input
                type="datetime-local"
                value={f.f_emision}
                onChange={e => setF({ ...f, f_emision: e.target.value })}
              />
            </div>

            <div className="field">
              <label>ID caja (opcional)</label>
              <input
                value={f.id_caja}
                onChange={e => setF({ ...f, id_caja: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Estado</label>
              <select value={f.estado} onChange={e => setF({ ...f, estado: e.target.value })}>
                <option value="vigente">Vigente</option>
                <option value="vencido">Vencido</option>
              </select>
            </div>

            <div className="field">
            <label>Vendedor</label>
            <input value={vendedorDisplay} readOnly className="ro" />
            </div>


            <div className="field col-span-3">
              <label>Descripción (opcional)</label>
              <input
                value={f.descripcion}
                onChange={e => setF({ ...f, descripcion: e.target.value })}
                placeholder="Observaciones…"
              />
            </div>
          </div>
        </section>

        {/* Paciente */}
        <section className="card">
          <div className="card-head"><h2>Paciente</h2></div>
          <div className="card-body">
            <div className="field">
              <label>Buscar paciente</label>
              <input
                value={pacQ}
                onChange={(e) => setPacQ(e.target.value)}
                placeholder="Nombre o RUT…"
                aria-autocomplete="list"
                aria-expanded={pacList.length > 0}
              />
              {(pacLoading || pacErr || pacQd.trim() || pacList.length > 0) && (
                <div className="ac-list" role="listbox">
                  {pacLoading && <div className="ac-item muted">Buscando…</div>}
                  {pacErr && !pacLoading && <div className="ac-item error">{pacErr}</div>}
                  {!pacLoading && !pacErr && pacList.length === 0 && pacQd.trim() && (
                    <div className="ac-item muted">Sin resultados</div>
                  )}
                  {pacList.map(p => (
                    <div
                      key={p.id}
                      className="ac-item"
                      onClick={() => {
                        setF({ ...f, id_paciente: p.id });
                        setPacQ(`${p.name} (${p.id})`);
                        setPacList([]);
                      }}
                    >
                      <div className="name-strong">{p.name}</div>
                      <div className="muted">{p.id}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="muted">
              Seleccionado: <strong>{f.id_paciente || "—"}</strong>
            </div>
          </div>
        </section>

        {/* Ítems */}
        <section className="card">
          <div className="card-head"><h2>Medicamentos</h2></div>
          <div className="card-body">
            <div className="item-row">
              <div className="field grow">
                <label>Buscar medicamento</label>
                <input
                  value={medQ}
                  onChange={(e) => setMedQ(e.target.value)}
                  placeholder="Código, nombre o principio activo…"
                  aria-autocomplete="list"
                  aria-expanded={medList.length > 0}
                />
                {(medLoading || medErr || medQd.trim() || medList.length > 0) && (
                  <div className="ac-list" role="listbox">
                    {medLoading && <div className="ac-item muted">Buscando…</div>}
                    {medErr && !medLoading && <div className="ac-item error">{medErr}</div>}
                    {!medLoading && !medErr && medList.length === 0 && medQd.trim() && (
                      <div className="ac-item muted">Sin resultados</div>
                    )}
                    {medList.map(m => (
                      <div
                        key={m.id}
                        className="ac-item"
                        onClick={() => {
                          setItemDraft(d => ({
                            ...d,
                            medicamento_id: m.id,
                            nombre: m.nombre || m.id,
                            princ_act: m.princ_act || ""
                          }));
                          setMedQ(`${m.nombre || m.id} (${m.id})`);
                          setMedList([]);
                        }}
                      >
                        <div className="name-strong">{m.nombre || m.id}</div>
                        <div className="muted">{m.princ_act || "—"}</div>
                        <div className="pill light">Stock: {m.stock_total ?? 0}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="field">
                <label>Cantidad</label>
                <input
                  type="number" min="1"
                  value={itemDraft.cantidad}
                  onChange={(e) => setItemDraft(d => ({ ...d, cantidad: Number(e.target.value || 1) }))}
                />
              </div>

              <div className="field">
                <label>Precio unit.</label>
                <input
                  type="number" min="0"
                  value={itemDraft.precio_unit}
                  onChange={(e) => setItemDraft(d => ({ ...d, precio_unit: Number(e.target.value || 0) }))}
                />
              </div>

              <div className="field">
                <label>&nbsp;</label>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={addItem}
                  disabled={!canAdd}
                  title={!itemDraft.medicamento_id ? "Selecciona un medicamento" : undefined}
                >
                  <i className="fa fa-plus" /> Agregar
                </button>
              </div>
            </div>

            {/* Lista */}
            <div className="l-head four">
              <div>Medicamento</div>
              <div className="right">Cant.</div>
              <div className="right">P. Unit</div>
              <div className="right">Subtotal</div>
            </div>
            {items.length === 0 ? (
              <div className="l-empty">No hay ítems aún.</div>
            ) : items.map((x, i) => (
              <div className="l-row four" key={i}>
                <div>
                  <div className="name-strong">{x.nombre || x.medicamento_id}</div>
                  <div className="muted">{x.princ_act || "—"}</div>
                </div>
                <div className="right">{x.cantidad}</div>
                <div className="right">${Number(x.precio_unit).toLocaleString()}</div>
                <div className="right">
                  ${Number(x.cantidad * x.precio_unit).toLocaleString()}
                  <button
                    className="btn-ghost small"
                    style={{ marginLeft: 8 }}
                    onClick={(e) => (e.preventDefault(), removeItem(i))}
                    title="Eliminar"
                  >
                    <i className="fa fa-trash" />
                  </button>
                </div>
              </div>
            ))}

            <div className="bx-totals">
              <div><strong>Total:</strong> ${Number(total).toLocaleString()}</div>
            </div>
          </div>
        </section>

        <div className="bx-actions end">
          <button type="button" className="btn-ghost" onClick={() => nav(-1)}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading || !f.id_paciente || items.length === 0}>
            {loading ? "Guardando…" : "Guardar boleta"}
          </button>
        </div>
      </form>
    </div>
  );
}
