// src/pages/intranet/usuarios/usuarios.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import './usuarios.css';

const PAGE_SIZE = 10;

/* ------------------ Helpers ------------------ */
function initials(nombres = '', ap = '') {
  const a = (nombres || '').trim().charAt(0) || '';
  const b = (ap || '').trim().charAt(0) || '';
  return (a + b).toUpperCase();
}
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d)) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  return `${dd} / ${mm} / ${yy}`;
}

/* ------------------ Filtros compactos ------------------ */
function FilterBar({
  roles, unidades,
  roleId, setRoleId,
  unitId, setUnitId,
  onlyOnline, setOnlyOnline,
  onClear,
}) {
  const roleSelected = roles.find(r => String(r.id) === String(roleId));
  const unitSelected = unidades.find(u => String(u.id) === String(unitId));

  return (
    <section className="usr-filters card-elev">
      <div className="usr-filters__row">
        <button
          className={`usr-pill ${(!roleId && !unitId && !onlyOnline) ? 'is-active' : ''}`}
          onClick={onClear}
        >
          Todos
        </button>

        {/* Rol */}
        <details className="usr-dd">
          <summary className={`usr-pill has-caret ${roleId ? 'is-active' : ''}`}>
            Rol {roleSelected ? `· ${roleSelected.nombre}` : ''}
          </summary>
          <div className="usr-dd__panel">
            <div className="usr-dd__group">
              <button className={`usr-chip ${!roleId ? 'is-active' : ''}`} onClick={() => setRoleId('')}>Todos</button>
              {roles.map(r => (
                <button
                  key={r.id}
                  className={`usr-chip ${String(roleId) === String(r.id) ? 'is-active' : ''}`}
                  onClick={() => setRoleId(r.id)}
                >
                  {r.nombre}
                </button>
              ))}
            </div>
          </div>
        </details>

        {/* Unidad */}
        <details className="usr-dd">
          <summary className={`usr-pill has-caret ${unitId ? 'is-active' : ''}`}>
            Unidad {unitSelected ? `· ${unitSelected.nombre}` : ''}
          </summary>
          <div className="usr-dd__panel">
            <div className="usr-dd__group usr-scroll">
              <button className={`usr-chip ${!unitId ? 'is-active' : ''}`} onClick={() => setUnitId('')}>Todas</button>
              {unidades.map(u => (
                <button
                  key={u.id}
                  className={`usr-chip ${String(unitId) === String(u.id) ? 'is-active' : ''}`}
                  onClick={() => setUnitId(u.id)}
                >
                  {u.nombre}
                </button>
              ))}
            </div>
          </div>
        </details>

        {/* Estado */}
        <button
          className={`usr-pill ${onlyOnline ? 'is-active' : ''}`}
          onClick={() => setOnlyOnline(v => !v)}
          title="Solo en línea"
        >
          <span className="dot on" /> En línea
        </button>
      </div>
    </section>
  );
}

/* ------------------ Modal centrado (mockup) ------------------ */
function QuickUserModal({ open, user, onClose }) {
  const [full, setFull] = useState(null);
  const token = localStorage.getItem('token') || '';

  // Carga perezosa de detalles si existe endpoint /api/users/:rut
  useEffect(() => {
    if (!open || !user?.rut) return;
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(`/api/users/${encodeURIComponent(user.rut)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) return; // si no existe, seguimos con datos de la tabla
        const json = await res.json();
        if (!cancel) setFull(json || null);
      } catch {}
    })();
    return () => { cancel = true; };
  }, [open, user?.rut, token]);

  if (!open || !user) return null;

  const u = { ...user, ...(full || {}) };

  return (
    <div className="usr-qp__overlay" onClick={onClose}>
      <div className="usr-qp__panel" onClick={(e) => e.stopPropagation()}>
        <header className="usr-qp__head">
          <div className="avatar lg">{initials(u.nombres, u.apellido_paterno)}</div>

          <div className="usr-qp__title">

            <div className="usr-qp__name">
              {u.nombres} {u.apellido_paterno} {u.apellido_materno}
            </div>

            <span className={`usr-badge ${u.online ? 'is-online' : 'is-offline'}`}>
              {u.online ? 'En línea' : 'Desconectado'}
            </span>
          </div>
          <button className="usr-qp__close" onClick={onClose} aria-label="Cerrar">✕</button>
        </header>

        <div className="usr-qp__content">
          {/* Datos personales */}
          <section className="usr-qp__section">
            <h3 className="usr-qp__sectionTitle">Datos personales:</h3>
            <div className="usr-qp__box">
              <div className="usr-field">
                <label className="usr-field__label">RUT:</label>
                <div className="usr-field__value">{u.rut || '—'}</div>
              </div>
              <div className="usr-field">
                <label className="usr-field__label">Fecha Nacimiento:</label>
                <div className="usr-field__value">{formatDate(u.fecha_nacimiento) || '—'}</div>
              </div>
            </div>
          </section>

          {/* Datos administrativos */}
          <section className="usr-qp__section">
            <h3 className="usr-qp__sectionTitle">Datos administrativos:</h3>
            <div className="usr-qp__box">
              <div className="usr-field">
                <label className="usr-field__label">Rol:</label>
                <div className="usr-field__value">
                  <span className="chip chip-rol">{u.rol || '—'}</span>
                </div>
              </div>
              <div className="usr-field">
                <label className="usr-field__label">Unidad:</label>
                <div className="usr-field__value">
                  <span className="chip chip-unidad">{u.unidad || '—'}</span>
                </div>
              </div>
              <div className="usr-field">
                <label className="usr-field__label">Cargo:</label>
                <div className="usr-field__value">{u.cargo || '—'}</div>
              </div>
            </div>
          </section>

          {/* Contactos */}
          <section className="usr-qp__section">
            <h3 className="usr-qp__sectionTitle">Contactos:</h3>
            <div className="usr-qp__box">
              <div className="usr-field">
                <label className="usr-field__label">Correo:</label>
                <div className="usr-field__value">
                  {u.correo ? <a href={`mailto:${u.correo}`}>{u.correo}</a> : '—'}
                </div>
              </div>
              <div className="usr-field">
                <label className="usr-field__label">Teléfono:</label>
                <div className="usr-field__value">{u.telefono || '—'}</div>
              </div>
            </div>
          </section>
        </div>

        <footer className="usr-qp__foot">
          <button className="btn-ghost" onClick={onClose}>Cerrar</button>
        </footer>
      </div>
    </div>
  );
}

/* ------------------ Página ------------------ */
export default function Usuarios() {
  const navigate = useNavigate();

  // estado tabla
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: PAGE_SIZE });

  // filtros
  const [roles, setRoles] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [roleId, setRoleId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [onlyOnline, setOnlyOnline] = useState(false);
  const [compact, setCompact] = useState(false);

  // modal
  const [quick, setQuick] = useState({ open: false, user: null });

  // bloquear scroll body cuando el modal está abierto
  useEffect(() => {
    if (!quick.open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [quick.open]);

  const columnHelper = createColumnHelper();
  const columns = useMemo(() => [
    columnHelper.display({
      id: 'online',
      header: '',
      cell: ({ row }) => (
        <abbr
          title={row.original.online ? 'En línea' : 'Desconectado'}
          className={`dot ${row.original.online ? 'on' : 'off'}`}
        />
      ),
      size: 36,
      meta: { headerClassName: 'col-online', cellClassName: 'col-online' }
    }),
    columnHelper.display({
      id: 'nombre',
      header: 'Nombre completo',
      enableSorting: true,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="name-cell with-avatar">
            <div className="avatar">{initials(r.nombres, r.apellido_paterno)}</div>
            <div className="name-text">
              <div className="name-strong">
                {`${r.nombres} ${r.apellido_paterno} ${r.apellido_materno}`.trim()}
              </div>
            </div>
          </div>
        );
      },
      meta: { headerClassName: 'col-name', cellClassName: 'col-name' }
    }),
    columnHelper.accessor('rut', { header: 'RUT', enableSorting: true, meta: { headerClassName: 'col-rut', cellClassName: 'col-rut' } }),
    columnHelper.accessor('correo', {
      header: 'Correo',
      enableSorting: true,
      cell: info => {
        const mail = info.getValue();
        return mail ? <a className="mail-link" href={`mailto:${mail}`}>{mail}</a> : '—';
      },
      meta: { headerClassName: 'col-email', cellClassName: 'col-email' }
    }),
    columnHelper.accessor('rol', {
      header: 'Rol', enableSorting: true,
      cell: info => <span className="chip chip-rol">{info.getValue() || '—'}</span>,
      meta: { headerClassName: 'col-rol', cellClassName: 'col-rol' }
    }),
    columnHelper.accessor('unidad', {
      header: 'Unidad', enableSorting: true,
      cell: info => <span className="chip chip-unidad">{info.getValue() || '—'}</span>,
      meta: { headerClassName: 'col-unidad', cellClassName: 'col-unidad' }
    }),
  ], []);

  const table = useReactTable({
    data, columns,
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

  // lookups
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [r, u] = await Promise.all([
          fetch('/api/lookups/roles').then(r => r.json()),
          fetch('/api/lookups/unidades').then(r => r.json()),
        ]);
        if (!cancel) { setRoles(r || []); setUnidades(u || []); }
      } catch {}
    })();
    return () => { cancel = true; };
  }, []);

  // cargar tabla
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true); setErr('');
        const s = sorting[0];
        let sortKey = s?.id || 'apellido_paterno';
        if (sortKey === 'nombre') sortKey = 'apellido_paterno';
        const dir = s?.desc ? 'desc' : 'asc';

        const params = new URLSearchParams({
          page: String(pagination.pageIndex + 1),
          pageSize: String(pagination.pageSize),
          sort: sortKey,
          dir,
        });
        if (globalFilter.trim()) params.set('search', globalFilter.trim());
        if (roleId) params.set('role_id', roleId);
        if (unitId) params.set('unit_id', unitId);
        if (onlyOnline) params.set('only_online', '1');

        const res = await fetch(`/api/users?${params.toString()}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || 'Error cargando usuarios');
        if (!cancel) { setData(json.rows || []); setTotal(json.total || 0); }
      } catch (e) {
        if (!cancel) setErr(e.message);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [sorting, globalFilter, pagination.pageIndex, pagination.pageSize, roleId, unitId, onlyOnline]);

  const clearFilters = () => {
    setRoleId(''); setUnitId(''); setOnlyOnline(false);
    setPagination(p => ({ ...p, pageIndex: 0 }));
  };

  return (
    <div className="users-page container-xl">
      {/* header */}
      <header className="users-header">
        <div>
          <h1>Usuarios</h1>
          <p className="subtitle">Gestiona los usuarios de la intranet COMDES</p>
        </div>

        <div className="actions">
          <div className="search-wrap">
            <svg className="search-ico" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15.5 14h-.79l-.28-.27a6.471 6.471 0 001.48-5.34C15.2 5.01 12.19 2 8.6 2S2 5.01 2 8.39s3.01 6.39 6.6 6.39c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6.9 0C6 14 3.8 11.79 3.8 9.09S6 4.18 8.6 4.18s4.8 2.21 4.8 4.91S11.2 14 8.6 14z"/>
            </svg>
            <input
              className="search"
              placeholder="Buscar por nombre, RUT, correo, unidad…"
              value={globalFilter}
              onChange={(e) => { setGlobalFilter(e.target.value); setPagination(p => ({ ...p, pageIndex: 0 })); }}
            />
          </div>

          <button
            className={`btn-ghost toggle-density ${compact ? 'is-on' : ''}`}
            onClick={() => setCompact(v => !v)}
            title="Alternar vista compacta"
          >
            {compact ? 'Vista cómoda' : 'Vista compacta'}
          </button>

          <button className="btn-primary" onClick={() => navigate('/intranet/usuarios/nuevo')}>
            Nuevo usuario
          </button>
        </div>
      </header>

      {/* filtros */}
      <FilterBar
        roles={roles} unidades={unidades}
        roleId={roleId} setRoleId={id => { setRoleId(id); setPagination(p => ({ ...p, pageIndex: 0 })); }}
        unitId={unitId} setUnitId={id => { setUnitId(id); setPagination(p => ({ ...p, pageIndex: 0 })); }}
        onlyOnline={onlyOnline} setOnlyOnline={v => { setOnlyOnline(v); setPagination(p => ({ ...p, pageIndex: 0 })); }}
        onClear={clearFilters}
      />

      {err && <div className="alert error">{err}</div>}

      {/* tabla */}
      <div className={`table-wrap card-elev ${compact ? 'is-compact' : ''}`}>
        <table className="table">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const metaH = header.column.columnDef.meta?.headerClassName || '';
                  return (
                    <th
                      key={header.id}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      className={`${canSort ? 'th-sortable' : ''} ${metaH}`}
                      aria-sort={sorted || 'none'}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
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
              table.getRowModel().rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className="row-clickable row-anim"
                  style={{ '--i': idx }}
                  onClick={() => setQuick({ open: true, user: row.original })}
                >
                  {row.getVisibleCells().map(cell => {
                    const metaC = cell.column.columnDef.meta?.cellClassName || '';
                    return (
                      <td key={cell.id} className={metaC}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
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
          <span className="muted-count"> · {total} usuarios</span>
        </span>
        <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Siguiente
        </button>
      </footer>

      {/* Modal centrado mockup */}
      <QuickUserModal
        open={quick.open}
        user={quick.user}
        onClose={() => setQuick({ open: false, user: null })}
      />
    </div>
  );
}
