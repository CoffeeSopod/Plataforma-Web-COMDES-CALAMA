// src/intranet/farmacia/medicamentos.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import "./medicamentos.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faFileImport, faPlusCircle } from "@fortawesome/free-solid-svg-icons";

const PAGE_SIZE = 10;

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

function daysTo(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.ceil((d.setHours(0,0,0,0) - now.setHours(0,0,0,0)) / 86400000);
  return Number.isNaN(diff) ? null : diff;
}

function EstadoBadge({ value }) {
  const v = (value || "").toLowerCase();
  const label = v === "oculto" ? "Oculto" : "Visible";
  return <span className={`est-pill ${v === "oculto" ? "danger" : "ok"}`}>{label}</span>;
}

function ImgCell({ src, alt }) {
  const fallback = "/assets/images/farmacia/medicamento/placeholder.png";
  const [ok, setOk] = useState(true);
  const url = ok && src ? src : fallback;
  return (
    <div className="img-cell">
      <img
        src={url}
        alt={alt || "medicamento"}
        onError={() => setOk(false)}
        loading="lazy"
      />
    </div>
  );
}

export default function Medicamentos() {
  const navigate = useNavigate();

  // ===== Tabla principal (inventario agregado) =====
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [sorting, setSorting] = useState([]); // [{ id, desc }]
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: PAGE_SIZE });

  // ===== Modales =====
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErr, setDetailErr] = useState("");
  const [detail, setDetail] = useState(null); // { medicamento, lotes }
  const [selectedId, setSelectedId] = useState(null);

  const [importOpen, setImportOpen] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  const columnHelper = createColumnHelper();

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "img",
        header: "",
        size: 64,
        cell: ({ row }) => <ImgCell src={row.original.img} alt={row.original.nombre} />,
      }),
      columnHelper.accessor("id", {
        header: "Código",
        enableSorting: true,
        size: 140,
        cell: (info) => <code className="code-chip">{info.getValue()}</code>,
      }),
      columnHelper.display({
        id: "nombre",
        header: "Medicamento",
        enableSorting: true, // mapea a 'nombre'
        cell: ({ row }) => {
          const m = row.original;
          return (
            <div className="name-cell">
              <div className="name-strong">{m.nombre || "—"}</div>
              <div className="muted">{m.princ_act || "—"}</div>
            </div>
          );
        },
      }),
      columnHelper.accessor("stock_total", {
        header: "Stock",
        enableSorting: true,
        size: 90,
        cell: (info) => <span className="qty">{info.getValue() ?? 0}</span>,
      }),
      columnHelper.accessor("proximo_venc", {
        header: "Próx. vence",
        enableSorting: true,
        size: 140,
        cell: (info) => {
          const val = info.getValue();
          const d = daysTo(val);
          return (
            <div className="venc-cell">
              <span>{fmtDate(val)}</span>
              {d !== null && (
                <span className={`venc-chip ${d < 0 ? "exp" : d <= 60 ? "soon" : ""}`}>
                  {d < 0 ? "Vencido" : d === 0 ? "Hoy" : `En ${d}d`}
                </span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("lotes", {
        header: "Lotes",
        enableSorting: true,
        size: 80,
        cell: (info) => <span className="badge">{info.getValue() ?? 0}</span>,
      }),
      columnHelper.accessor("estado", {
        header: "Estado",
        enableSorting: true,
        size: 130,
        cell: (info) => <EstadoBadge value={info.getValue()} />,
      }),
      columnHelper.display({
        id: "acciones",
        header: "",
        size: 70,
        cell: ({ row }) => (
          <button
            className="icon-btn small"
            title="Ver"
            data-tip="Ver"
            onClick={(e) => {
              e.stopPropagation();
              openDetail(row.original.id);
            }}
            aria-label="Ver"
          >
            <FontAwesomeIcon icon={faEye} />
            <span className="sr-only">Ver</span>
          </button>
        ),
      }),

    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: Math.max(Math.ceil(total / pagination.pageSize), 1),
  });

  // ===== Cargar inventario agregado =====
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const s = sorting[0];
        let sortKey = s?.id || "nombre";
        if (sortKey === "nombre") sortKey = "nombre";
        if (sortKey === "img") sortKey = "nombre";

        const dir = s?.desc ? "desc" : "asc";
        const params = new URLSearchParams({
          page: String(pagination.pageIndex + 1),
          pageSize: String(pagination.pageSize),
          sort: sortKey,
          dir,
        });
        if (globalFilter.trim()) params.set("search", globalFilter.trim());

        const res = await fetch(`/api/inventario?${params.toString()}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Error cargando inventario");

        if (!cancel) {
          setData(json.rows || []);
          setTotal(json.total || 0);
        }
      } catch (e) {
        if (!cancel) setErr(e.message);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [sorting, globalFilter, pagination.pageIndex, pagination.pageSize, reloadTick]);

  // ===== Modal detalle (lotes) =====
  async function openDetail(id) {
    setSelectedId(id);
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailErr("");
    try {
      const res = await fetch(`/api/inventario/${encodeURIComponent(id)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Error cargando detalle");
      setDetail(json);
    } catch (e) {
      setDetailErr(e.message);
    } finally {
      setDetailLoading(false);
    }
  }
  const closeDetail = () => {
    setDetailOpen(false);
    setDetail(null);
    setSelectedId(null);
    setDetailErr("");
  };

  return (
    <div className="mx-shell mx-inventory">
      <div className="mx-page">
        <header className="mx-header v2">
          {/* Fila 1: título izq, subtítulo der */}
          <div className="mx-head-top">
            <h1>Inventario de farmacia</h1>
            <p className="subtitle right">Resumen por medicamento (suma de lotes).</p>
          </div>

          {/* Fila 2: búsqueda izq, botones der */}
          <div className="mx-head-bottom">
            <div className="search-wrap">
              <svg className="search-ico" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15.5 14h-.79l-.28-.27a6.471 6.471 0 001.48-5.34C15.2 5.01 12.19 2 8.6 2S2 5.01 2 8.39s3.01 6.39 6.6 6.39c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6.9 0C6 14 3.8 11.79 3.8 9.09S6 4.18 8.6 4.18s4.8 2.21 4.8 4.91S11.2 14 8.6 14z"/>
              </svg>
              <input
                className="search"
                placeholder="Buscar por código, nombre, principio activo…"
                value={globalFilter}
                onChange={(e) => {
                  setGlobalFilter(e.target.value);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              />
            </div>

            <div className="btn-row">
              <button
                className="btn-primary btn-icon"
                onClick={() => navigate("/intranet/farmacia/medicamentos/nueva_entrada")}
              >
                <FontAwesomeIcon icon={faPlusCircle} /> 
                <span>Nueva guía de entrada</span>
              </button>

              <button
                className="btn-outline"
                onClick={() => setImportOpen(true)}
              >
                <FontAwesomeIcon icon={faFileImport} /> 
                <span>Importar registros</span>
              </button>

            </div>
          </div>
        </header>

        {err && <div className="alert error">{err}</div>}

        <div className="table-wrap">
          <table className="table">
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
                        style={{ width: h.getSize() }}
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
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="center">Cargando…</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="center">Sin resultados</td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="clickable" onClick={() => openDetail(row.id)}>
                    {columns.map((col) => (
                      <td key={col.id || col.accessorKey}>
                        {flexRender(col.cell, {
                          row: { original: row },
                          getValue: () => row[col.accessorKey],
                          column: { columnDef: col },
                        })}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="pager">
          <button onClick={() => table.previousPage()} disabled={pagination.pageIndex === 0}>
            Anterior
          </button>
          <span>
            Página {pagination.pageIndex + 1} de {Math.max(Math.ceil(total / pagination.pageSize), 1)}
          </span>
          <button
            onClick={() => setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))}
            disabled={(pagination.pageIndex + 1) * pagination.pageSize >= total}
          >
            Siguiente
          </button>
        </footer>
      </div>

      {/* ===== Modal de detalle ===== */}
      {detailOpen && (
        <InvModal onClose={closeDetail} title={`Detalle de ${selectedId}`}>
          {detailLoading ? (
            <div className="center muted" style={{ padding: 20 }}>Cargando detalle…</div>
          ) : detailErr ? (
            <div className="alert error">{detailErr}</div>
          ) : !detail ? (
            <div className="center muted" style={{ padding: 20 }}>Sin datos</div>
          ) : (
            <DetailView detail={detail} />
          )}
        </InvModal>
      )}

      {/* ===== Modal de importación ===== */}
      {importOpen && (
        <InvModal title="Importar inventario (XLSX/CSV)" onClose={() => setImportOpen(false)}>
          <ImportBody
            onDone={(summary) => {
              setReloadTick(t => t + 1); // refrescar tabla
              setImportOpen(false);
            }}
          />
        </InvModal>
      )}
    </div>
  );
}

/* ===== Modal del módulo de inventario (aislado) ===== */
function InvModal({ title, children, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // lock scroll
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className="mxinv-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="mxinv-modal" onClick={(e) => e.stopPropagation()}>
        <header className="mxinv-modal-head">
          <strong>{title}</strong>
          <button className="btn-ghost small" onClick={onClose} aria-label="Cerrar">✕</button>
        </header>
        <div className="mxinv-modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ===== Cuerpo del modal de importación ===== */
function ImportBody({ onDone }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setErr("Selecciona un archivo .xlsx o .csv");
    setErr(""); setOk(""); setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/inventario/import", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.message || "Error importando");
      setOk(`Importado: ${j.grouped_rows} filas agrupadas (saltadas: ${j.skipped})`);
      setTimeout(() => onDone?.(j), 600);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mxinv-import">
      <p className="muted" style={{marginTop:0}}>
        Columnas esperadas (orden libre): <strong>Cod. Producto</strong>, <strong>Proveedor</strong>, <strong>Producto</strong>, <strong>Principio Activo</strong>, <strong>Partida / Talla</strong>, <strong>Fecha Venc</strong> y opcional <strong>Cantidad</strong>.
      </p>

      {err && <div className="alert error">{err}</div>}
      {ok && <div className="alert success">{ok}</div>}

      <label className="mxinv-file">
        <input
          type="file"
          accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <span>{file ? file.name : "Selecciona un archivo .xlsx o .csv"}</span>
      </label>

      <div className="end" style={{marginTop:12}}>
        <button type="submit" className="btn-primary" disabled={loading || !file}>
          {loading ? "Importando…" : "Importar"}
        </button>
      </div>
    </form>
  );
}

/* ===== Contenido del detalle ===== */
function DetailView({ detail }) {
  const m = detail.medicamento || {};
  const lotes = Array.isArray(detail.lotes) ? detail.lotes : [];
  const stock = lotes.reduce((a, x) => a + (Number(x.cantidad) || 0), 0);

  return (
    <div className="detail">
      <div className="detail-head">
        <ImgCell src={m.img} alt={m.nombre} />
        <div className="detail-title">
          <div className="name-strong">{m.nombre || m.id}</div>
          <div className="muted">{m.princ_act || "—"}</div>
          <div className="pill-row">
            <EstadoBadge value={m.estado} />
            <span className="pill">{stock} en stock</span>
            <span className="pill light">{lotes.length} lotes</span>
          </div>
        </div>
      </div>

      <div className="lotes-table">
        <div className="l-head">
          <div>Lote</div>
          <div>Vence</div>
          <div>Proveedor</div>
          <div>Estado</div>
          <div className="right">Cantidad</div>
          <div>Registro</div>
        </div>
        {lotes.length === 0 ? (
          <div className="l-empty">Este medicamento no tiene lotes.</div>
        ) : (
          lotes.map((l) => {
            const d = daysTo(l.f_ven);
            return (
              <div key={l.id} className="l-row">
                <div className="mono">{l.lote}</div>
                <div className="mono">
                  {fmtDate(l.f_ven)}{" "}
                  {d !== null && <span className={`venc-chip xs ${d < 0 ? "exp" : d <= 60 ? "soon" : ""}`}>
                    {d < 0 ? "Vencido" : d === 0 ? "Hoy" : `En ${d}d`}
                  </span>}
                </div>
                <div>{l.proveedor || "—"}</div>
                <div><span className={`est-dot ${l.estado}`}>{l.estado}</span></div>
                <div className="right">{l.cantidad}</div>
                <div className="mono">{fmtDate(l.f_regis)}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
