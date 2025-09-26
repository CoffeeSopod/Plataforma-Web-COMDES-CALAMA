// src/pages/FarmaciaCiudadana.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";

import "keen-slider/keen-slider.min.css";
import "./farmacia_ciudadana.css";

/* ===== Helpers ===== */
function MultiText({ text, className = "multiline", as = "p" }) {
  if (!text) return null;
  const Tag = as;
  const norm = String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  const blocks = norm.split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        return (
          <Tag key={i} className={className}>
            {lines.map((line, j) => (
              <React.Fragment key={j}>
                {line}
                {j < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </Tag>
        );
      })}
    </>
  );
}

/* Mapa: sanea <iframe> o URL */
const ALLOWED_MAP_HOSTS = new Set(["www.google.com","maps.google.com","www.google.cl","maps.app.goo.gl"]);
const extractIframeSrc = (html) => {
  const m = String(html).match(/<iframe[^>]*\s+src=["']([^"']+)["'][^>]*>/i);
  return m ? m[1] : null;
};
const isAllowedMapUrl = (s) => {
  try { const u = new URL(s); return ALLOWED_MAP_HOSTS.has(u.hostname); } catch { return false; }
};
function MapEmbed({ embed }) {
  if (!embed) return <div className="map-placeholder">Mapa próximamente</div>;
  let src = embed;
  if (/<iframe/i.test(embed)) src = extractIframeSrc(embed) || "";
  if (!isAllowedMapUrl(src)) return <div className="map-placeholder">Mapa no disponible (URL no permitida).</div>;
  return (
    <div className="map-embed">
      <iframe
        src={src}
        loading="lazy"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-popups"
        referrerPolicy="no-referrer-when-downgrade"
        title="Ubicación en Google Maps"
      />
    </div>
  );
}

/* ===== Página especializada: Farmacia Ciudadana ===== */
export default function FarmaciaCiudadanaPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loadingCentro, setLoadingCentro] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // Inventario para tabla
  const [meds, setMeds] = useState({ items: [], loading: true, error: null });

  /* Datos del centro */
  useEffect(() => {
    const controller = new AbortController();
    setLoadingCentro(true);
    setLoaded(false);
    (async () => {
      try {
        const res = await fetch(`/api/centros/${slug}`, { signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        setData(json);
        setLoadingCentro(false);
        requestAnimationFrame(() => setLoaded(true));
      } catch (e) {
        if (e.name !== "AbortError") { setData(null); setLoadingCentro(false); }
      }
    })();
    return () => controller.abort();
  }, [slug]);

  /* Inventario (para la tabla) */
  useEffect(() => {
    const controller = new AbortController();
    setMeds((m) => ({ ...m, loading: true, error: null }));
    (async () => {
      try {
        const params = new URLSearchParams({
          page: "1",
          pageSize: "500", // suficiente para buscar+paginar client-side
          sort: "nombre",
          dir: "asc",
        });
        const res = await fetch(`/api/inventario?${params.toString()}`, { signal: controller.signal });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Error cargando inventario");
        setMeds({ items: Array.isArray(json.rows) ? json.rows : [], loading: false, error: null });
      } catch (e) {
        if (e.name !== "AbortError") setMeds({ items: [], loading: false, error: "No se pudo cargar el inventario" });
      }
    })();
    return () => controller.abort();
  }, []);

  /* ====== Derivar filas base ====== */
  const columnHelper = createColumnHelper();

  const baseRows = useMemo(() => {
    const list = meds.items
      .filter((m) => (m.estado || "visible") === "visible")
      .map((m) => {
        const cantidad = Number(m.stock_total ?? m.cantidad ?? 0);
        let stockLabel = "Sin existencias";
        let stockClass = "stock-none";
        if (cantidad >= 50) { stockLabel = "En stock"; stockClass = "stock-ok"; }
        else if (cantidad > 0 && cantidad <= 20) { stockLabel = "Stock limitado"; stockClass = "stock-low"; }
        else if (cantidad > 20 && cantidad < 50) { stockLabel = "En stock"; stockClass = "stock-mid"; }

        return {
          id: m.id,
          img: m.img || "/assets/images/farmacia/medicamento/placeholder.png",
          nombre: m.nombre || "",
          princ_act: m.princ_act || "",
          stockLabel,
          stockClass,
        };
      });

    const rank = { "stock-ok": 3, "stock-mid": 2, "stock-low": 1, "stock-none": 0 };
    return list.sort((a, b) => rank[b.stockClass] - rank[a.stockClass] || a.nombre.localeCompare(b.nombre));
  }, [meds.items]);

  /* ====== Filtros / búsqueda / orden / paginación ====== */
  const [globalFilter, setGlobalFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("all"); // all | stock-ok | stock-mid | stock-low | stock-none
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 6 });
  const [sortPreset, setSortPreset] = useState("nombre-asc"); // presets opcionales

  // 1) Filtro por disponibilidad
  const filteredByStock = useMemo(() => {
    if (stockFilter === "all") return baseRows;
    return baseRows.filter((r) => r.stockClass === stockFilter);
  }, [baseRows, stockFilter]);

  // 2) Búsqueda (nombre o principio activo) — filtro aplicado ANTES de pasar a la tabla
  const filteredByText = useMemo(() => {
    const q = globalFilter.trim().toLowerCase();
    if (!q) return filteredByStock;
    return filteredByStock.filter((r) =>
      (r.nombre || "").toLowerCase().includes(q) ||
      (r.princ_act || "").toLowerCase().includes(q)
    );
  }, [filteredByStock, globalFilter]);

  // 3) Datos que entran a TanStack (ya filtrados por stock + texto)
  const dataForTable = filteredByText;

  // Presets de orden (además de click en cabeceras)
  useEffect(() => {
    if (sortPreset === "nombre-asc") setSorting([{ id: "nombre", desc: false }]);
    else if (sortPreset === "nombre-desc") setSorting([{ id: "nombre", desc: true }]);
    else if (sortPreset === "disp") setSorting([{ id: "stock", desc: true }]); // primero mayor disponibilidad
  }, [sortPreset]);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);
  const openModal = (item) => { setModalItem(item); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setModalItem(null); };

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "img",
        header: "",
        size: 80,
        cell: ({ row }) => (
          <div className="fc-img">
            <img
              src={row.original.img}
              alt={row.original.nombre}
              loading="lazy"
              onError={(e) => { e.currentTarget.src = "/assets/images/farmacia/medicamento/placeholder.png"; }}
            />
          </div>
        ),
      }),
      columnHelper.display({
        id: "nombre",
        header: "Medicamento",
        enableSorting: true,
        cell: ({ row }) => (
          <div className="fc-name">
            <div className="strong">{row.original.nombre || "—"}</div>
            <div className="muted">{row.original.princ_act || "—"}</div>
          </div>
        ),
        sortingFn: (a, b) => a.original.nombre.localeCompare(b.original.nombre),
      }),
      columnHelper.display({
        id: "stock",
        header: "Disponibilidad",
        size: 180,
        enableSorting: true,
        cell: ({ row }) => (
          <span className={`med-stock-tag ${row.original.stockClass}`}>
            {row.original.stockLabel}
          </span>
        ),
        sortingFn: (a, b) => {
          const rank = { "stock-ok": 3, "stock-mid": 2, "stock-low": 1, "stock-none": 0 };
          return rank[b.original.stockClass] - rank[a.original.stockClass];
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: dataForTable,                    // << datos ya filtrados por texto y stock
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // paginación numerada con “...”
  const pages = (() => {
    const total = table.getPageCount();
    const current = table.getState().pagination.pageIndex;
    if (total <= 7) return [...Array(total)].map((_, i) => i);
    const around = [0, current - 1, current, current + 1, total - 1]
      .filter((i) => i >= 0 && i < total)
      .sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < around.length; i++) {
      if (i === 0 || around[i] === around[i - 1] + 1) result.push(around[i]);
      else result.push("…", around[i]);
    }
    return Array.from(new Set(result));
  })();

  /* ====== RETORNOS ====== */
  if (loadingCentro) return <CentroSkeleton />;

  if (!data) {
    return (
      <div className="centro-wrap">
        <div className="error-card">
          <h2>Centro no encontrado</h2>
          <p>Revisa el enlace o vuelve al listado.</p>
          <Link to="/centros" className="btn">Volver</Link>
        </div>
      </div>
    );
  }

  const nombreEncargado = [data.nombres_e, data.ap_pat_e, data.ap_mat_e].filter(Boolean).join(" ");
  const avatarSrc = data.url_avatar || "/assets/images/unidades/avatar/placeholder.png";

  const totalFiltered = dataForTable.length;
  const { pageIndex, pageSize } = table.getState().pagination;
  const from = Math.min(totalFiltered, pageIndex * pageSize + 1);
  const to = Math.min(totalFiltered, (pageIndex + 1) * pageSize);

  return (
    <div className={`centro-wrap ${loaded ? "is-loaded" : ""}`}>
      {/* HERO */}
      <section className="hero" style={{ "--hero": `url(${data.url_banner || ""})` }}>
        <div className="hero-overlay">
          <div className="container hero-inner">
            {data.url_logo && (
              <img className="hero-logo" src={data.url_logo} alt={data.nombre_salud} loading="lazy" decoding="async" />
            )}
            <div className="hero-title">
              <span className="hero-sub">UNIDADES TRANSVERSALES</span>
              <h1>{data.nombre_salud}</h1>
            </div>
            <div className="topbar-stripes" aria-hidden="true" role="presentation">
              <span className="stripe stripe-purple"></span>
              <span className="stripe stripe-blue"></span>
              <span className="stripe stripe-green"></span>
              <span className="stripe stripe-white"></span>
              <span className="stripe stripe-yellow"></span>
              <span className="stripe stripe-orange"></span>
              <span className="stripe stripe-red"></span>
            </div>
          </div>
        </div>
      </section>

      {/* ====== TABLA PÚBLICA ====== */}
      <section className="centro-section">
        <div className="container tabla-med">
          <div className="fc-head">
            <h2>Listado de medicamentos</h2>

            {/* Búsqueda + filtros + ordenar */}
            <div className="fc-controls">
              <div className="fc-search">
                <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15.5 14h-.79l-.28-.27a6.471 6.471 0 001.48-5.34C15.2 5.01 12.19 2 8.6 2S2 5.01 2 8.39s3.01 6.39 6.6 6.39c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6.9 0C6 14 3.8 11.79 3.8 9.09S6 4.18 8.6 4.18s4.8 2.21 4.8 4.91S11.2 14 8.6 14z"/>
                </svg>
                <input
                  className="input"
                  placeholder="Buscar por nombre o principio activo…"
                  value={globalFilter}
                  onChange={(e) => {
                    setGlobalFilter(e.target.value);
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                  }}
                />
              </div>

              <div className="fc-filter">
                <select
                  value={stockFilter}
                  onChange={(e) => {
                    setStockFilter(e.target.value);
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                  }}
                >
                  <option value="all">Todas las disponibilidades</option>
                  <option value="stock-ok">En stock</option>
                  <option value="stock-mid">En stock (medio)</option>
                  <option value="stock-low">Stock limitado</option>
                  <option value="stock-none">Sin existencias</option>
                </select>
              </div>

              <div className="fc-sort">
                <select
                  value={sortPreset}
                  onChange={(e) => setSortPreset(e.target.value)}
                  title="Ordenar por"
                >
                  <option value="nombre-asc">Nombre (A–Z)</option>
                  <option value="nombre-desc">Nombre (Z–A)</option>
                  <option value="disp">Disponibilidad</option>
                </select>
              </div>
            </div>
          </div>

          {meds.loading ? (
            <div className="meds-skeleton">Cargando inventario…</div>
          ) : meds.error ? (
            <div className="meds-error">{meds.error}</div>
          ) : (
            <>
              <div className="fc-table-wrap">
                <table className="fc-table">
                  <thead>
                    {table.getHeaderGroups().map((hg) => (
                      <tr key={hg.id}>
                        {hg.headers.map((h) => {
                          const canSort = h.column.getCanSort();
                          const sorted = h.column.getIsSorted();
                          return (
                            <th
                              key={h.id}
                              onClick={canSort ? h.column.getToggleSortingHandler() : undefined}
                              className={canSort ? "th-sortable" : undefined}
                              aria-sort={sorted || "none"}
                              style={{ width: h.getSize?.() }}
                            >
                              {flexRender(h.column.columnDef.header, h.getContext())}
                              {canSort && (
                                <span className={`sort ${sorted === "desc" ? "desc" : sorted ? "asc" : ""}`} />
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.length === 0 ? (
                      <tr><td colSpan={columns.length} className="center">Sin resultados</td></tr>
                    ) : (
                      table.getRowModel().rows.map((r) => (
                        <tr
                          key={r.id}
                          className="clickable"
                          onClick={() => openModal(r.original)}
                          title="Ver detalle"
                        >
                          {r.getVisibleCells().map((cell) => (
                            <td key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="fc-pager">
                <button
                  className="pg-btn"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  ‹ Anterior
                </button>

                <div className="pg-pages">
                  {pages.map((p, i) =>
                    p === "…" ? (
                      <span key={`e${i}`} className="pg-ellipsis">…</span>
                    ) : (
                      <button
                        key={p}
                        className={`pg-num ${p === pageIndex ? "active" : ""}`}
                        onClick={() => table.setPageIndex(p)}
                        aria-current={p === pageIndex ? "page" : undefined}
                      >
                        {p + 1}
                      </button>
                    )
                  )}
                </div>

                <button
                  className="pg-btn"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Siguiente ›
                </button>

                <span className="pg-meta">
                  Mostrando {from}–{to} de {totalFiltered}
                </span>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ====== CONTENEDOR 1: Encargado + Horario + Quiénes somos ====== */}
      <section className="centro-section">
        <div className="container cluster-info">
          <article className="card card--encargado">
            <img className="enc-avatar" src={avatarSrc} alt={`Foto de ${nombreEncargado || "encargado/a"}`} loading="lazy" decoding="async" />
            <div className="enc-head">Contacto Principal</div>
            <div className="enc-body">
              <div className="info">
                <div className="lbl">{nombreEncargado || "Por confirmar"}</div>
                <div className="sub">{data.cargo_e || "Cargo no informado"}</div>
                {data.telefono && <div className="row"><span className="ico">📞</span><span>{data.telefono}</span></div>}
                {data.correo && <div className="row"><span className="ico">✉️</span><span>{data.correo}</span></div>}
              </div>
            </div>
            <div className="enc-bottomline" />
          </article>

          <article className="card card--horario">
            <div className="horario-icon"><div className="clock-pill" aria-hidden>🕒</div></div>
            <div className="horario-body">
              <h3>HORARIO DE ATENCIÓN</h3>
              <MultiText text={data.h_atencion} />
            </div>
          </article>

          <article className="card card--qs">
            <h3>QUIÉNES SOMOS</h3>
            <MultiText text={data.quienes_somos} />
          </article>
        </div>
      </section>

      {/* ===== Modal Imagen ===== */}
      {modalOpen && modalItem && (
        <div className="fc-modal-overlay" role="dialog" aria-modal="true" onClick={closeModal}>
          <div className="fc-modal" onClick={(e) => e.stopPropagation()}>
            <header className="fc-modal-head">
              <strong>{modalItem.nombre}</strong>
              <button className="btn-ghost small" onClick={closeModal} aria-label="Cerrar">✕</button>
            </header>
            <div className="fc-modal-body">
              <div className="fc-modal-media">
                <img
                  src={modalItem.img}
                  alt={modalItem.nombre}
                  onError={(e) => { e.currentTarget.src = "/assets/images/farmacia/medicamento/placeholder.png"; }}
                />
              </div>
              <div className="fc-modal-info">
                <div className="muted">{modalItem.princ_act || "—"}</div>
                <div className="pill-row">
                  <span className={`med-stock-tag ${modalItem.stockClass}`}>{modalItem.stockLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Skeleton ===== */
function CentroSkeleton() {
  return (
    <div className="centro-wrap sk">
      <div className="hero sk-box" />
      <section className="centro-section">
        <div className="container">
          <div className="card sk-box" style={{ height: 180 }} />
        </div>
      </section>
    </div>
  );
}
