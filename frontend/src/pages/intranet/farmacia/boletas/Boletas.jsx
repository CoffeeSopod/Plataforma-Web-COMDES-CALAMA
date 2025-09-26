// src/farmacia/boletas/Boletas.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./boletas.css";

function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export default function Boletas() {
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // detalle
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [dLoading, setDLoading] = useState(false);
  const [dErr, setDErr] = useState("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true); setErr("");
        const params = new URLSearchParams({
          page: String(page),
          pageSize: "10",
        });
        if (search.trim()) params.set("search", search.trim());
        const r = await fetch(`/api/boletas?${params.toString()}`);
        const j = await r.json();
        if (!r.ok) throw new Error(j?.message || "Error al cargar boletas");
        if (!cancel) { setRows(j.rows || []); setTotal(j.total || 0); }
      } catch (e) {
        if (!cancel) setErr(e.message);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [page, search]);

  const openDetail = async (id) => {
    setOpen(true);
    setDLoading(true);
    setDErr("");
    try {
      const r = await fetch(`/api/boletas/${encodeURIComponent(id)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.message || "Error cargando boleta");
      setDetail(j);
    } catch (e) {
      setDErr(e.message);
    } finally {
      setDLoading(false);
    }
  };

  return (
    <div className="bx-shell">
      <div className="bx-header">
        <div className="bx-hl">
          <h1>Boletas</h1>
          <p className="subtitle">Registros de ventas de farmacia.</p>
        </div>
        <div className="bx-hr">
          <div className="search-wrap">
            <input
              className="search"
              value={search}
              placeholder="Buscar por boleta, paciente, rut…"
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <button className="btn-primary" onClick={() => nav("/intranet/farmacia/nueva_boleta")}>
            <i className="fa fa-file-invoice-dollar" /> Nueva boleta
          </button>
        </div>
      </div>

      {err && <div className="alert error">{err}</div>}

      <div className="bx-table">
        <table>
          <thead>
            <tr>
              <th>Boleta</th>
              <th>Paciente</th>
              <th>Fecha</th>
              <th>Ítems</th>
              <th>Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="center">Cargando…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="center">Sin resultados</td></tr>
            ) : rows.map(r => (
              <tr key={r.id}>
                <td><code className="code-chip">{r.id}</code></td>
                <td>{r.paciente_nombre || r.paciente_id || "—"}</td>
                <td>{fmtDateTime(r.f_emision)}</td>
                <td><span className="badge">{r.items ?? 0}</span></td>
                <td>${Number(r.v_total || 0).toLocaleString()}</td>
                <td className="right">
                  <button className="btn-outline small" onClick={() => openDetail(r.id)}>
                    <i className="fa fa-eye" /> <span className="hide-sm">Ver</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal detalle */}
      {open && (
        <div className="bx-modal-overlay" onClick={() => setOpen(false)}>
          <div className="bx-modal" onClick={(e) => e.stopPropagation()}>
            <header className="bx-modal-head">
              <strong>Detalle boleta {detail?.boleta?.id || ""}</strong>
              <button className="btn-ghost small" onClick={() => setOpen(false)}>✕</button>
            </header>
            <div className="bx-modal-body">
              {dLoading ? (
                <div className="center muted">Cargando…</div>
              ) : dErr ? (
                <div className="alert error">{dErr}</div>
              ) : !detail ? (
                <div className="center muted">Sin datos</div>
              ) : (
                <BoletaDetail data={detail} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BoletaDetail({ data }) {
  const b = data.boleta || {};
  const items = data.items || [];
  const lots = data.items_lotes || [];
  const lotsByItem = items.reduce((acc, it) => {
    acc[it.id] = [];
    return acc;
  }, {});
  for (const l of lots) {
    if (!lotsByItem[l.boleta_item_id]) lotsByItem[l.boleta_item_id] = [];
    lotsByItem[l.boleta_item_id].push(l);
  }

  return (
    <div className="bx-detail">
      <div className="bx-detail-grid">
        <div><strong>Paciente:</strong> {b.paciente_nombre || b.id_paciente}</div>
        <div><strong>Fecha:</strong> {b.f_emision}</div>
        <div><strong>Estado:</strong> {b.estado}</div>
      </div>

      <div className="bx-items">
        <div className="l-head">
          <div>Medicamento</div>
          <div className="right">Cant.</div>
          <div className="right">P. Unit</div>
          <div className="right">Subtotal</div>
        </div>
        {items.map(it => (
          <div key={it.id} className="l-row">
            <div>
              <div className="name-strong">{it.nombre || it.medicamento_id}</div>
              <div className="muted">{it.princ_act || "—"}</div>
              {Array.isArray(lotsByItem[it.id]) && lotsByItem[it.id].length > 0 && (
                <div className="lots">
                  {lotsByItem[it.id].map(l => (
                    <span key={`${l.boleta_item_id}-${l.lote_id}`} className="lot-pill">
                      Lote {l.lote} · {l.cantidad}u · vence {l.f_ven}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="right">{it.cantidad}</div>
            <div className="right">${Number(it.precio_unit).toLocaleString()}</div>
            <div className="right">${Number(it.subtotal).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="bx-totals">
        <div><strong>Neto:</strong> ${Number(b.v_neto || 0).toLocaleString()}</div>
        <div><strong>Total:</strong> ${Number(b.v_total || 0).toLocaleString()}</div>
      </div>
    </div>
  );
}
