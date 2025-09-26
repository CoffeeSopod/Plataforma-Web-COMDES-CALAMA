import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './nuevo_medicamento.css';

const ESTADOS = [
  { value: 'habilitado', label: 'Habilitado' },
  { value: 'restringido', label: 'Restringido' },
];

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function NuevoMedicamento() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    id: '',
    nombre: '',
    princ_act: '',
    lote: '',
    f_ven: '',            // opcional
    proveedor: '',
    cantidad: 0,
    f_regis: todayISO(),  // requerido por backend
    estado: 'habilitado', // enum
  });

  const [file, setFile] = useState(null);     // imagen opcional
  const [preview, setPreview] = useState(''); // vista previa
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'cantidad' ? Number(value ?? 0) : value }));
  };

  // drag & drop opcional
  const onFile = (f) => {
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const errors = useMemo(() => {
    const e = {};
    if (!form.id.trim()) e.id = 'Requerido';
    if (!form.nombre.trim()) e.nombre = 'Requerido';
    if (!form.f_regis) e.f_regis = 'Requerido';
    // f_ven opcional; si viene, debe tener formato fecha (el input ya lo valida)
    return e;
  }, [form]);

  const hasErrors = Object.keys(errors).length > 0;

  async function onSubmit(e) {
    e.preventDefault();
    setErr(''); setOk(''); setLoading(true);
    try {
      // 1) Crear registro (JSON)
      const res = await fetch('/api/medicamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          princ_act: form.princ_act || null,
          lote: form.lote || null,
          f_ven: form.f_ven || null,
          proveedor: form.proveedor || null,
          cantidad: Number(form.cantidad) || 0,
          img: null, // la subimos luego si adjuntaron archivo
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Error creando medicamento');

      // 2) Subir imagen (opcional)
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        const up = await fetch(`/api/medicamentos/${encodeURIComponent(form.id)}/image`, {
          method: 'POST',
          body: fd,
        });
        const upData = await up.json();
        if (!up.ok) throw new Error(upData?.message || 'Error subiendo imagen');
      }

      setOk('Medicamento creado correctamente');
      setTimeout(() => navigate('/intranet/farmacia/medicamentos'), 700);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-shell">
      <div className="nm-page">
        <header className="nm-header">
          <div>
            <h1>Nuevo medicamento</h1>
            <p className="subtitle">Completa la información y guarda para agregarlo al inventario.</p>
          </div>
          <div className="actions">
            <button className="btn-ghost" type="button" onClick={() => navigate(-1)}>Cancelar</button>
          </div>
        </header>

        {err && <div className="alert error">{err}</div>}
        {ok && <div className="alert success">{ok}</div>}

        <form className="nm-form" onSubmit={onSubmit}>
          {/* Bloque 1: Datos principales */}
          <section className="card appear">
            <div className="card-head">
              <h2>Datos principales</h2>
              <p>Identificación, nombre comercial y principio activo.</p>
            </div>
            <div className="card-body grid-2">
              <div className={`field ${errors.id ? 'has-error' : ''}`}>
                <label>Código / ID *</label>
                <input name="id" value={form.id} onChange={onChange} placeholder="Ej: IBUP-400-123" required />
                {errors.id && <small>{errors.id}</small>}
              </div>

              <div className={`field ${errors.nombre ? 'has-error' : ''}`}>
                <label>Nombre *</label>
                <input name="nombre" value={form.nombre} onChange={onChange} placeholder="Ibuprofeno 400mg" required />
                {errors.nombre && <small>{errors.nombre}</small>}
              </div>

              <div className="field">
                <label>Principio activo</label>
                <input name="princ_act" value={form.princ_act} onChange={onChange} placeholder="Ibuprofeno" />
              </div>

              <div className="field">
                <label>Lote</label>
                <input name="lote" value={form.lote} onChange={onChange} placeholder="L001-A" />
              </div>
            </div>
          </section>

          {/* Bloque 2: Fechas y proveedor */}
          <section className="card appear delay-1">
            <div className="card-head">
              <h2>Fechas & proveedor</h2>
              <p>Fechas de registro y vencimiento, y origen del producto.</p>
            </div>
            <div className="card-body grid-2">
              <div className={`field ${errors.f_regis ? 'has-error' : ''}`}>
                <label>Fecha de registro *</label>
                <input type="date" name="f_regis" value={form.f_regis} onChange={onChange} required />
                {errors.f_regis && <small>{errors.f_regis}</small>}
              </div>

              <div className="field">
                <label>Fecha de vencimiento</label>
                <input type="date" name="f_ven" value={form.f_ven} onChange={onChange} />
              </div>

              <div className="field">
                <label>Proveedor</label>
                <input name="proveedor" value={form.proveedor} onChange={onChange} placeholder="Proveedor X" />
              </div>

              <div className="field">
                <label>Cantidad</label>
                <input type="number" name="cantidad" min="0" value={form.cantidad} onChange={onChange} />
              </div>

              <div className="field">
                <label>Estado</label>
                <select name="estado" value={form.estado} onChange={onChange}>
                  {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Bloque 3: Imagen (opcional) */}
          <section className="card appear delay-2">
            <div className="card-head">
              <h2>Imagen (opcional)</h2>
              <p>Sube una imagen del medicamento para mostrarla en el catálogo.</p>
            </div>
            <div className="card-body">
              <div
                className="drop"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) onFile(f);
                }}
              >
                {preview ? (
                  <img src={preview} alt="preview" className="preview" />
                ) : (
                  <>
                    <p>Arrastra y suelta una imagen aquí, o</p>
                    <label className="btn-outline">
                      Seleccionar archivo
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        hidden
                        onChange={(e) => onFile(e.target.files?.[0])}
                      />
                    </label>
                  </>
                )}
              </div>
            </div>
          </section>

          <div className="nm-actions end">
            <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading || hasErrors}>
              {loading ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
