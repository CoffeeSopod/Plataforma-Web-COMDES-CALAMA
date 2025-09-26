import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./guia_entrada_nueva.css";

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const ESTADOS_GUIA = [
  { value: "vigente", label: "Vigente" },
  { value: "restringido", label: "Restringido" },
];

export default function GuiaEntradaNueva() {
  const navigate = useNavigate();

  // ===== Cabecera guía =====
  const [conceptos, setConceptos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [provQuery, setProvQuery] = useState("");
  const [provSel, setProvSel] = useState(null);

  const [cab, setCab] = useState({
    id_concepto: "",
    f_emision: todayISO(),
    estado: "vigente",
    descripcion: "",
    n_factura: "",
    f_factura: todayISO(),
  });

  // ===== Ítems =====
  const [buscarMed, setBuscarMed] = useState("");
  const [sugsMed, setSugsMed] = useState([]);
  const [allMedsCache, setAllMedsCache] = useState(null); // fallback cache
  const [item, setItem] = useState({
    id: "",
    nombre: "",
    princ_act: "",
    cantidad: 0,
    lote: "",
    f_ven: "",
  });
  const [items, setItems] = useState([]);
  const [editIndex, setEditIndex] = useState(-1);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  // ===== Cargar catálogos =====
  useEffect(() => {
    (async () => {
      try {
        const [r1, r2] = await Promise.all([
          fetch("/api/catalogos/conceptos"),
          fetch("/api/catalogos/proveedores"),
        ]);
        const c = r1.ok ? await r1.json() : [];
        const p = r2.ok ? await r2.json() : [];
        setConceptos(Array.isArray(c) ? c : []);
        setProveedores(Array.isArray(p) ? p : []);
      } catch (e) {
        console.error("catalogos error", e);
      }
    })();
  }, []);

  // ===== Autocomplete proveedor =====
  const provFiltered = useMemo(() => {
    const q = provQuery.trim().toLowerCase();
    if (!q) return proveedores.slice(0, 8);
    return proveedores.filter((p) => String(p.nombre || "").toLowerCase().includes(q)).slice(0, 20);
  }, [proveedores, provQuery]);

  const seleccionarProveedor = (p) => {
    setProvSel(p);
    setProvQuery(p?.nombre || "");
  };

  // ===== Autocomplete medicamento =====
  // Intenta servidor: /api/medicamentos/search?query=...
  // Fallback: /api/medicamentos y filtra en cliente
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = buscarMed.trim();
      if (!q) { setSugsMed([]); return; }
      try {
        // 1) intento server-side search
        const r = await fetch(`/api/medicamentos/search?query=${encodeURIComponent(q)}`);
        if (r.ok) {
          const data = await r.json();
          setSugsMed(Array.isArray(data) ? data.slice(0, 12) : []);
          return;
        }
      } catch { /* ignora y usa fallback */ }

      // 2) fallback a /api/medicamentos (si no hay endpoint search)
      try {
        if (!allMedsCache) {
          const rAll = await fetch("/api/medicamentos");
          const all = rAll.ok ? await rAll.json() : [];
          setAllMedsCache(Array.isArray(all) ? all : []);
          const fil = (Array.isArray(all) ? all : []).filter(
            (m) =>
              String(m.id || "").toLowerCase().includes(q.toLowerCase()) ||
              String(m.nombre || "").toLowerCase().includes(q.toLowerCase())
          );
          setSugsMed(fil.slice(0, 12));
        } else {
          const fil = allMedsCache.filter(
            (m) =>
              String(m.id || "").toLowerCase().includes(q.toLowerCase()) ||
              String(m.nombre || "").toLowerCase().includes(q.toLowerCase())
          );
          setSugsMed(fil.slice(0, 12));
        }
      } catch (e) {
        console.error("fallback meds error", e);
        setSugsMed([]);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [buscarMed, allMedsCache]);

  const tomarSugerenciaMed = (m) => {
    setItem((prev) => ({
      ...prev,
      id: m.id,
      nombre: m.nombre || prev.nombre,
      princ_act: m.princ_act || prev.princ_act,
    }));
    setBuscarMed(`${m.id} — ${m.nombre}`);
    setSugsMed([]);
  };

  const onCabChange = (e) => {
    const { name, value } = e.target;
    setCab((c) => ({ ...c, [name]: value }));
  };

  const onItemChange = (e) => {
    const { name, value } = e.target;
    setItem((it) => ({
      ...it,
      [name]:
        name === "cantidad"
          ? Number(value || 0)
          : value,
    }));
  };

  const limpiarItem = () => {
    setItem({ id: "", nombre: "", princ_act: "", cantidad: 0, lote: "", f_ven: "" });
    setBuscarMed("");
    setEditIndex(-1);
  };

  const agregarItem = () => {
    setErr("");
    // Validaciones mínimas del item
    const id = String(item.id || "").trim();
    const cant = Number(item.cantidad || 0);
    if (!id) return setErr("Debes indicar el ID del medicamento.");
    if (!item.lote.trim()) return setErr("Debes indicar el lote.");
    if (!item.f_ven) return setErr("Debes indicar la fecha de vencimiento.");
    if (cant <= 0) return setErr("La cantidad debe ser mayor a 0.");
    // Si el medicamento no existe, obligatorio nombre (para crear ficha)
    if (!buscarMed && !item.nombre.trim()) {
      return setErr("Para crear un medicamento nuevo debes indicar el nombre.");
    }

    const base = {
      id: id,
      nombre: item.nombre?.trim() || "",       // si existe id en catálogo, backend lo ignora
      princ_act: item.princ_act?.trim() || "", // idem
      cantidad: cant,
      lote: item.lote.trim(),
      f_ven: item.f_ven,
    };

    if (editIndex >= 0) {
      const clone = items.slice();
      clone[editIndex] = base;
      setItems(clone);
    } else {
      setItems((arr) => [...arr, base]);
    }
    limpiarItem();
  };

  const editarItem = (idx) => {
    const it = items[idx];
    setItem({
      id: it.id,
      nombre: it.nombre || "",
      princ_act: it.princ_act || "",
      cantidad: it.cantidad || 0,
      lote: it.lote || "",
      f_ven: it.f_ven || "",
    });
    setBuscarMed(it.id ? `${it.id}${it.nombre ? " — " + it.nombre : ""}` : "");
    setEditIndex(idx);
  };

  const borrarItem = (idx) => {
    setItems((arr) => arr.filter((_, i) => i !== idx));
    if (editIndex === idx) limpiarItem();
  };

  const totalUnidades = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0),
    [items]
  );

  async function onSubmit(e) {
    e.preventDefault();
    setErr(""); setOk("");

    if (!cab.id_concepto) return setErr("Debes seleccionar un concepto.");
    if (!provSel?.id) return setErr("Debes seleccionar un proveedor.");
    if (!cab.f_emision) return setErr("Debes indicar la fecha de emisión.");
    if (!items.length) return setErr("Agrega al menos un medicamento a la guía.");

    // payload
    const payload = {
      guia: {
        // id: opcional (lo genera el backend si no mandas)
        f_emision: cab.f_emision,
        estado: cab.estado,
        descripcion: cab.descripcion?.trim() || null,
        n_factura: cab.n_factura ? Number(cab.n_factura) : null,
        f_factura: cab.f_factura || null,
        id_concepto: cab.id_concepto,
        id_prov: provSel.id, // string
      },
      items: items.map((it) => ({
        medicamento: {
          id: it.id,
          nombre: it.nombre || null,
          princ_act: it.princ_act || null,
          estado: "visible",
        },
        lote: it.lote,
        f_ven: it.f_ven,
        cantidad: Number(it.cantidad) || 0,
        // precio_unit: null, // si luego lo usas, agrégalo al mini-form
        proveedor: provSel?.nombre || null,
      })),
    };

    try {
      setSaving(true);
      const r = await fetch("/api/guia-entrada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.message || "Error creando guía de entrada");
      setOk("Guía guardada correctamente.");
      setTimeout(() => navigate("/intranet/farmacia/medicamentos"), 700);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ge-shell">
      <div className="ge-page">
        <header className="ge-header">
          <div>
            <h1>Nueva guía de entrada</h1>
            <p className="subtitle">Registra una entrada en lote (uno o varios medicamentos).</p>
          </div>
          <div className="actions">
            <button className="btn-ghost" type="button" onClick={() => navigate(-1)}>Cancelar</button>
          </div>
        </header>

        {err && <div className="alert error">{err}</div>}
        {ok && <div className="alert success">{ok}</div>}

        <form className="ge-form" onSubmit={onSubmit}>
          {/* ===== Bloque: Cabecera ===== */}
          <section className="card appear">
            <div className="card-head">
              <h2>Datos de la guía</h2>
              <p>Concepto, fechas, estado y proveedor.</p>
            </div>

            <div className="card-body grid-2">
              <div className="field">
                <label>Concepto *</label>
                <select
                  name="id_concepto"
                  value={cab.id_concepto}
                  onChange={onCabChange}
                  required
                >
                  <option value="">— Selecciona —</option>
                  {conceptos.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Fecha de emisión *</label>
                <input
                  type="date"
                  name="f_emision"
                  value={cab.f_emision}
                  onChange={onCabChange}
                  required
                />
              </div>

              <div className="field">
                <label>Estado *</label>
                <select
                  name="estado"
                  value={cab.estado}
                  onChange={onCabChange}
                  required
                >
                  {ESTADOS_GUIA.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Descripción</label>
                <input
                  name="descripcion"
                  value={cab.descripcion}
                  onChange={onCabChange}
                  placeholder="Opcional"
                />
              </div>

              <div className="field col-2">
                <label>Proveedor *</label>
                <div className="ac-wrap">
                  <input
                    value={provQuery}
                    onChange={(e) => {
                      setProvQuery(e.target.value);
                      if (provSel && e.target.value !== provSel.nombre) setProvSel(null);
                    }}
                    placeholder="Buscar proveedor por nombre…"
                    aria-autocomplete="list"
                    aria-expanded={provQuery.length > 0}
                  />
                  {provQuery && (
                    <div className="ac-list">
                      {provFiltered.map((p) => (
                        <div
                          key={p.id}
                          className="ac-item"
                          onClick={() => seleccionarProveedor(p)}
                        >
                          {p.nombre}
                          <span className="muted"> · {p.id}</span>
                        </div>
                      ))}
                      {provFiltered.length === 0 && (
                        <div className="ac-empty">Sin resultados</div>
                      )}
                    </div>
                  )}
                </div>
                {provSel && <small className="muted">Seleccionado: <strong>{provSel.nombre}</strong> (ID: {provSel.id})</small>}
              </div>

              <div className="field">
                <label>N° Factura</label>
                <input
                  name="n_factura"
                  value={cab.n_factura}
                  onChange={onCabChange}
                  inputMode="numeric"
                  placeholder="Opcional"
                />
              </div>

              <div className="field">
                <label>Fecha factura</label>
                <input
                  type="date"
                  name="f_factura"
                  value={cab.f_factura}
                  onChange={onCabChange}
                />
              </div>
            </div>
          </section>

          {/* ===== Bloque: Ítems ===== */}
          <section className="card appear delay-1">
            <div className="card-head">
              <h2>Medicamentos</h2>
              <p>Agrega uno o más ítems a la guía.</p>
            </div>

            <div className="card-body">
              {/* Mini-form ítem */}
              <div className="grid-3">
                <div className="field col-3">
                  <label>Buscar / ID de medicamento *</label>
                  <div className="ac-wrap">
                    <input
                      value={buscarMed}
                      onChange={(e) => {
                        setBuscarMed(e.target.value);
                        // Si el usuario sobrescribe, intenta parsear ID directo delante de " — "
                        const raw = e.target.value;
                        const maybeId = raw.includes("—") ? raw.split("—")[0].trim() : raw.trim();
                        setItem((it) => ({ ...it, id: maybeId }));
                      }}
                      placeholder="Escribe ID o nombre…"
                      aria-autocomplete="list"
                    />
                    {!!sugsMed.length && (
                      <div className="ac-list">
                        {sugsMed.map((m) => (
                          <div
                            key={m.id}
                            className="ac-item"
                            onClick={() => tomarSugerenciaMed(m)}
                          >
                            <strong>{m.id}</strong> — {m.nombre}
                            {m.princ_act && <span className="muted"> · {m.princ_act}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="field">
                  <label>Nombre {item.id && "(si es nuevo)"}</label>
                  <input
                    name="nombre"
                    value={item.nombre}
                    onChange={onItemChange}
                    placeholder="Nombre del medicamento"
                  />
                </div>

                <div className="field">
                  <label>Principio activo</label>
                  <input
                    name="princ_act"
                    value={item.princ_act}
                    onChange={onItemChange}
                    placeholder="Opcional"
                  />
                </div>

                <div className="field">
                  <label>Cantidad *</label>
                  <input
                    type="number"
                    name="cantidad"
                    min="0"
                    value={item.cantidad}
                    onChange={onItemChange}
                  />
                </div>

                <div className="field">
                  <label>Lote *</label>
                  <input
                    name="lote"
                    value={item.lote}
                    onChange={onItemChange}
                    placeholder="Ej: L-123"
                  />
                </div>

                <div className="field">
                  <label>F. Vencimiento *</label>
                  <input
                    type="date"
                    name="f_ven"
                    value={item.f_ven}
                    onChange={onItemChange}
                  />
                </div>

                <div className="field col-3 right">
                  <button type="button" className="btn-outline" onClick={limpiarItem}>Limpiar</button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={agregarItem}
                  >
                    {editIndex >= 0 ? "Actualizar ítem" : "Agregar ítem"}
                  </button>
                </div>
              </div>

              {/* Lista de ítems agregados */}
              <div className="items-table">
                <div className="items-head">
                  <div>ID</div>
                  <div>Nombre</div>
                  <div>Principio activo</div>
                  <div>Lote</div>
                  <div>Vence</div>
                  <div className="right">Cant.</div>
                  <div className="right">Acciones</div>
                </div>
                {items.map((it, i) => (
                  <div key={`${it.id}-${it.lote}-${i}`} className="items-row">
                    <div className="mono">{it.id}</div>
                    <div>{it.nombre}</div>
                    <div className="muted">{it.princ_act}</div>
                    <div className="mono">{it.lote}</div>
                    <div className="mono">{it.f_ven}</div>
                    <div className="right">{it.cantidad}</div>
                    <div className="right">
                      <button type="button" className="btn-ghost small" onClick={() => editarItem(i)}>✎</button>
                      <button type="button" className="btn-ghost small danger" onClick={() => borrarItem(i)}>🗑</button>
                    </div>
                  </div>
                ))}
                {!items.length && (
                  <div className="items-empty">Aún no has agregado medicamentos a esta guía.</div>
                )}
                {!!items.length && (
                  <div className="items-foot">
                    <div>Total de unidades</div>
                    <div className="right"><strong>{totalUnidades}</strong></div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className="ge-actions end">
            <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving || !items.length}>
              {saving ? "Guardando…" : "Guardar guía"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
