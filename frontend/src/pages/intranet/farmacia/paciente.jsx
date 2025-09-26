import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import './paciente.css';

const PAGE_SIZE = 10;

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString();
  } catch { return iso; }
}

export default function Paciente() {
  const navigate = useNavigate();
  const [showImport, setShowImport] = useState(false);

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const [sorting, setSorting] = useState([]);          // [{ id:'ap_pat', desc:false }]
  const [globalFilter, setGlobalFilter] = useState(''); // búsqueda
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: PAGE_SIZE });

  const columnHelper = createColumnHelper();

  const columns = useMemo(() => [
    columnHelper.accessor('rut', {
      header: 'RUT',
      enableSorting: true,
      size: 140,
    }),

    // Nombre completo
    columnHelper.display({
      id: 'nombre',
      header: 'Nombre completo',
      enableSorting: true, // lo mapearé a ap_pat para ordenar
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="name-cell">
            <div className="name-strong">
              {`${p.nombres} ${p.ap_pat} ${p.ap_mat}`.trim()}
            </div>
            <div className="muted">{p.prevision || '—'}</div>
          </div>
        );
      },
    }),

    columnHelper.accessor('f_nac', {
      header: 'Fecha de nacimiento',
      enableSorting: true,
      cell: info => fmtDate(info.getValue()),
      size: 120,
    }),

    columnHelper.accessor('f_inscrip', {
      header: 'Fecha de Inscripción',
      enableSorting: true,
      cell: info => fmtDate(info.getValue()),
      size: 140,
    }),

    columnHelper.accessor('f_receta', {
      header: 'Fecha de Receta',
      enableSorting: true,
      cell: info => fmtDate(info.getValue()),
      size: 120,
    }),

    columnHelper.display({
      id: 'contacto',
      header: 'Contacto',
      enableSorting: false,
      cell: ({ row }) => {
        const { tel_fijo, celular } = row.original;
        return (
          <div className="contact">
            <span className="chip">{tel_fijo || '—'}</span>
            <span className="chip">{celular || '—'}</span>
          </div>
        );
      },
    }),
  ], []);

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

  useEffect(() => {
    let cancel = false;
    async function load() {
      try {
        setLoading(true);
        setErr('');

        const s = sorting[0];
        let sortKey = s?.id || 'ap_pat';
        if (sortKey === 'nombre') sortKey = 'ap_pat'; // orden por apellido paterno
        const dir = s?.desc ? 'desc' : 'asc';

        const params = new URLSearchParams({
          page: String(pagination.pageIndex + 1),
          pageSize: String(pagination.pageSize),
          sort: sortKey,
          dir,
        });
        if (globalFilter.trim()) params.set('search', globalFilter.trim());

        const res = await fetch(`/api/pacientes?${params.toString()}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || 'Error cargando pacientes');

        if (!cancel) {
          setData(json.rows || []);
          setTotal(json.total || 0);
        }
      } catch (e) {
        if (!cancel) setErr(e.message);
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    return () => { cancel = true; };
  }, [sorting, globalFilter, pagination.pageIndex, pagination.pageSize]);

  return (
    <div className="px-shell">
      <div className="px-page">
        <header className="px-header">
          <div>
            <h1>Pacientes</h1>
            <p className="subtitle">Listado de pacientes de Farmacia Ciudadana</p>
          </div>

          <div className="actions">
            <div className="search-wrap">
              <svg className="search-ico" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15.5 14h-.79l-.28-.27a6.471 6.471 0 001.48-5.34C15.2 5.01 12.19 2 8.6 2S2 5.01 2 8.39s3.01 6.39 6.6 6.39c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6.9 0C6 14 3.8 11.79 3.8 9.09S6 4.18 8.6 4.18s4.8 2.21 4.8 4.91S11.2 14 8.6 14z"/>
              </svg>
              <input
                className="search"
                placeholder="Buscar por RUT, nombre, previsión…"
                value={globalFilter}
                onChange={(e) => {
                  setGlobalFilter(e.target.value);
                  setPagination(p => ({ ...p, pageIndex: 0 }));
                }}
              />
            </div>

            <button className="btn-ghost" onClick={() => navigate('/intranet/farmacia/paciente/nuevo')}>
              Registrar paciente
            </button>
            <button className="btn-primary" onClick={() => setShowImport(true)}>
              Importar registros
            </button>
          </div>
        </header>
        {/* ... tabla y pager ... */}

        {showImport && (
          <ImportModal
            onClose={() => setShowImport(false)}
            onDone={(summary) => {
              // recarga tabla si hubo cambios
              setShowImport(false);
              // fuerza refresco simple
              setPagination(p => ({ ...p })); 
              if (summary?.ok) alert(`Importados: ${summary.inserted} | Actualizados: ${summary.updated}`);
              else alert(`Se procesó con errores. Revisa el detalle en el modal.`);
            }}
          />
        )}

        {err && <div className="alert error">{err}</div>}

        <div className="table-wrap">
          <table className="table">
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(h => {
                    const canSort = h.column.getCanSort();
                    const sorted = h.column.getIsSorted();
                    return (
                      <th
                        key={h.id}
                        onClick={canSort ? h.column.getToggleSortingHandler() : undefined}
                        className={canSort ? 'th-sortable' : undefined}
                        aria-sort={sorted || 'none'}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {canSort && <span className={`sort ${sorted === 'desc' ? 'desc' : sorted ? 'asc' : ''}`} />}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} className="center">Cargando…</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={columns.length} className="center">Sin resultados</td></tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
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

        <footer className="pager">
          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Anterior
          </button>
          <span>
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </span>
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Siguiente
          </button>
        </footer>
      </div>
    </div>
  );
}

/* -------- Modal de importación -------- */
function ImportModal({ onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState(null);
  const [err, setErr] = useState('');

  async function handleUpload(e) {
    e.preventDefault();
    setErr(''); setSummary(null);

    if (!file) { setErr('Selecciona un archivo .xlsx o .csv'); return; }
    const fd = new FormData();
    fd.append('file', file);

    try {
      setBusy(true);
      const res = await fetch('/api/pacientes/import', {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Error al importar');
      setSummary(data);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="paciente-modal-backdrop" onClick={onClose}>
      <div className="paciente-modal" onClick={(e) => e.stopPropagation()}>
        <header className="paciente-modal-head">
          <h3>Importar pacientes</h3>
          <button className="paciente-btn-x" onClick={onClose}>×</button>
        </header>

        <div className="paciente-modal-body">
          <p>Sube un archivo <b>.xlsx</b> o <b>.csv</b> con los encabezados:</p>
          <code className="paciente-code">
            NOMBRES, APELLIDO PATERNO, APELLIDO MATERNO, C. IDENTIDAD, PREVISION, F NAC, TELEFONO FIJO, CELULAR, FECHA INSCRIPCION, FECHA RECETA
          </code>

          <form onSubmit={handleUpload} className="paciente-upload-form">
            <input
              type="file"
              accept=".xlsx,.csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Procesando…' : 'Subir y procesar'}
            </button>
          </form>

          {err && <div className="alert error">{err}</div>}

          {summary && (
            <div className="paciente-import-summary">
              <h4>Resumen</h4>
              <ul>
                <li>Procesadas: <b>{summary.processed}</b></li>
                <li>Importadas (nuevas): <b>{summary.inserted}</b></li>
                <li>Actualizadas: <b>{summary.updated}</b></li>
                <li>Errores: <b>{summary.errors?.length || 0}</b></li>
              </ul>

              {summary.errors?.length > 0 && (
                <>
                  <h5>Detalles de errores</h5>
                  <div className="paciente-error-table">
                    <div className="paciente-error-head">
                      <span>Fila</span><span>RUT</span><span>Problemas</span>
                    </div>
                    {summary.errors.map((e, i) => (
                      <div key={i} className="paciente-error-row">
                        <span>{e.row}</span><span>{e.rut}</span><span>{e.errors.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="paciente-actions-end">
                <button className="paciente-btn-ghost" onClick={onClose}>Cerrar</button>
                <button className="paciente-btn-primary" onClick={() => onDone(summary)}>Listo</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}