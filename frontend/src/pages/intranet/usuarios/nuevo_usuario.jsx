// src/pages/intranet/usuarios/nuevo_usuario.jsx
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './nuevo_usuario.css';

function cleanRut(rut) {
  return String(rut || '')
    .replace(/\./g, '')
    .replace(/-/g, '')
    .replace(/\s+/g, '')
    .toUpperCase();
}
function validarRut(rut) {
  const c = cleanRut(rut);
  if (!/^[0-9]+[0-9K]$/.test(c)) return false;
  const dv = c.slice(-1);
  const num = c.slice(0, -1);
  let suma = 0, mul = 2;
  for (let i = num.length - 1; i >= 0; i--) {
    suma += parseInt(num[i], 10) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const res = 11 - (suma % 11);
  const dvCalc = res === 11 ? '0' : res === 10 ? 'K' : String(res);
  return dvCalc === dv;
}
function isFuture(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  d.setHours(0,0,0,0);
  today.setHours(0,0,0,0);
  return d.getTime() > today.getTime();
}

export default function NuevoUsuario() {
  const navigate = useNavigate();
  const firstErrorRef = useRef(null);

  const [roles, setRoles] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  // errores que puedan venir del backend: { campo: "mensaje" }
  const [serverErrors, setServerErrors] = useState({});

  const [form, setForm] = useState({
    rut: '',
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    fecha_nacimiento: '',
    cargo: '',
    correo: '',
    telefono: '',
    rol_id: '',
    id_unidad: '',
    password: '',
    confirmPassword: ''
  });
  const [touched, setTouched] = useState({});

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [r, u] = await Promise.all([
          fetch('/api/lookups/roles').then(r => r.json()),
          fetch('/api/lookups/unidades').then(r => r.json())
        ]);
        if (!cancel) { setRoles(r || []); setUnidades(u || []); }
      } catch {
        if (!cancel) setErr('No se pudieron cargar roles/unidades');
      }
    })();
    return () => { cancel = true; };
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setServerErrors(se => ({ ...se, [name]: undefined })); // borra error server al editar
  };
  const onBlur = (e) => {
    const { name } = e.target;
    setTouched(t => ({ ...t, [name]: true }));
  };

  // Validaciones en cliente (más expresivas)
  const errors = useMemo(() => {
    const e = {};
    if (!form.rut.trim()) e.rut = 'Requerido';
    else if (!validarRut(form.rut)) e.rut = 'RUT inválido (sin puntos y con guion)';

    if (!form.fecha_nacimiento) e.fecha_nacimiento = 'Requerido';
    else if (isFuture(form.fecha_nacimiento)) e.fecha_nacimiento = 'No puede ser futura';

    if (!form.nombres.trim()) e.nombres = 'Requerido';
    if (!form.apellido_paterno.trim()) e.apellido_paterno = 'Requerido';
    if (!form.apellido_materno.trim()) e.apellido_materno = 'Requerido';

    if (!form.correo.trim()) e.correo = 'Requerido';

    if (!form.rol_id) e.rol_id = 'Selecciona un rol';
    if (!form.id_unidad) e.id_unidad = 'Selecciona una unidad';

    if (form.password) {
      if (form.password.length < 8) e.password = 'Mínimo 8 caracteres';
      if (form.confirmPassword !== form.password) e.confirmPassword = 'No coincide';
    }
    return e;
  }, [form]);

  const hasErrors = Object.keys(errors).length > 0;

  // Scroll al primer error visible
  useEffect(() => {
    if (firstErrorRef.current) {
      firstErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [serverErrors, touched]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(''); setOk('');
    // marca todos tocados
    setTouched(Object.keys(form).reduce((acc, k) => (acc[k] = true, acc), {}));
    setServerErrors({});

    if (hasErrors) {
      // marca un ancla para el primer error de cliente
      const firstKey = Object.keys(errors)[0];
      firstErrorRef.current = document.querySelector(`[name="${firstKey}"]`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          confirmPassword: undefined,
          correo: form.correo.trim().toLowerCase(),
          telefono: form.telefono ? Number(form.telefono) : null,
          rol_id: Number(form.rol_id),
          id_unidad: Number(form.id_unidad)
        })
      });
      const data = await res.json();

      if (!res.ok) {
        // si backend manda errores por campo, muéstralos
        if (data?.errors && typeof data.errors === 'object') {
          setServerErrors(data.errors);
          const firstServerKey = Object.keys(data.errors)[0];
          firstErrorRef.current = document.querySelector(`[name="${firstServerKey}"]`);
        }
        throw new Error(data?.message || 'Error al crear usuario');
      }

      setOk('Usuario creado correctamente');
      if (data?.tempPassword) alert(`Contraseña temporal: ${data.tempPassword}`);
      setTimeout(() => navigate(-1), 700);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  }

  // helper para decidir mensaje (cliente o server) y marcar clase de error
  const fieldError = (name) => serverErrors[name] || errors[name];
  const fieldClass = (name) =>
    touched[name] && fieldError(name) ? 'field has-error' : 'field';

  return (
    <div className="nu-shell">
      <div className="nu-page">
        <header className="nu-header">
          <div>
            <h1>Registrar nuevo usuario</h1>
            <p className="nu-sub">Completa los datos en cada bloque y guarda al final.</p>
          </div>
          <div className="nu-actions">
            <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>Cancelar</button>
            <button type="button" className="btn-outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Subir</button>
          </div>
        </header>

        {err && <div className="alert error">{err}</div>}
        {ok && <div className="alert success">{ok}</div>}

        <form className="nu-form" onSubmit={onSubmit}>
          {/* Datos personales */}
          <section className="card appear">
            <div className="card-head">
              <h2>Datos personales</h2>
              <p>Identificación y datos básicos del funcionario.</p>
            </div>
            <div className="card-body grid-2">
              <div className={fieldClass('rut')}>
                <label>RUT</label>
                <input
                  name="rut"
                  value={form.rut}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="Sin puntos y con guión"
                  required
                />
                {touched.rut && fieldError('rut') && <small>{fieldError('rut')}</small>}
              </div>

              <div className={fieldClass('fecha_nacimiento')}>
                <label>Fecha de nacimiento</label>
                <input
                  type="date"
                  name="fecha_nacimiento"
                  value={form.fecha_nacimiento}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                />
                {touched.fecha_nacimiento && fieldError('fecha_nacimiento') && <small>{fieldError('fecha_nacimiento')}</small>}
              </div>

              <div className={fieldClass('nombres')}>
                <label>Nombres</label>
                <input name="nombres" value={form.nombres} onChange={onChange} onBlur={onBlur} required />
                {touched.nombres && fieldError('nombres') && <small>{fieldError('nombres')}</small>}
              </div>

              <div className={fieldClass('apellido_paterno')}>
                <label>Apellido paterno</label>
                <input name="apellido_paterno" value={form.apellido_paterno} onChange={onChange} onBlur={onBlur} required />
                {touched.apellido_paterno && fieldError('apellido_paterno') && <small>{fieldError('apellido_paterno')}</small>}
              </div>

              <div className={fieldClass('apellido_materno')}>
                <label>Apellido materno</label>
                <input name="apellido_materno" value={form.apellido_materno} onChange={onChange} onBlur={onBlur} required />
                {touched.apellido_materno && fieldError('apellido_materno') && <small>{fieldError('apellido_materno')}</small>}
              </div>
            </div>
          </section>

          {/* Datos administrativos */}
          <section className="card appear delay-1">
            <div className="card-head">
              <h2>Datos administrativos</h2>
              <p>Rol y unidad dentro de la corporación.</p>
            </div>

            <div className="card-body grid-2">
              <div className={fieldClass('id_unidad')}>
                <label>Unidad</label>
                <select name="id_unidad" value={form.id_unidad} onChange={onChange} onBlur={onBlur} required>
                  <option value="">Selecciona unidad…</option>
                  {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                </select>
                {touched.id_unidad && fieldError('id_unidad') && <small>{fieldError('id_unidad')}</small>}
              </div>

              <div className="field">
                <label>Cargo</label>
                <input name="cargo" value={form.cargo} onChange={onChange} onBlur={onBlur} />
              </div>

              <div className={fieldClass('rol_id')}>
                <label>Rol</label>
                <select name="rol_id" value={form.rol_id} onChange={onChange} onBlur={onBlur} required>
                  <option value="">Selecciona rol…</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
                {touched.rol_id && fieldError('rol_id') && <small>{fieldError('rol_id')}</small>}
              </div>
            </div>
          </section>

          {/* Datos de contacto */}
          <section className="card appear delay-2">
            <div className="card-head">
              <h2>Datos de contacto</h2>
              <p>Información para comunicación interna.</p>
            </div>
            <div className="card-body grid-2">
              <div className={fieldClass('correo')}>
                <label>Correo</label>
                <input type="email" name="correo" value={form.correo} onChange={onChange} onBlur={onBlur} required />
                {touched.correo && fieldError('correo') && <small>{fieldError('correo')}</small>}
              </div>

              <div className="field">
                <label>Teléfono</label>
                <input type="number" name="telefono" value={form.telefono} onChange={onChange} placeholder="Opcional" />
              </div>
            </div>
          </section>

          {/* Contraseña */}
          <section className="card appear delay-3">
            <div className="card-head">
              <h2>Contraseña</h2>
              <p>Déjala vacía para que el sistema genere una temporal.</p>
            </div>
            <div className="card-body grid-2">
              <div className={fieldClass('password')}>
                <label>Contraseña (opcional)</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="Mín. 8 caracteres"
                />
                {touched.password && fieldError('password') && <small>{fieldError('password')}</small>}
              </div>

              <div className={fieldClass('confirmPassword')}>
                <label>Repetir contraseña</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="Escribe la misma contraseña"
                />
                {touched.confirmPassword && fieldError('confirmPassword') && <small>{fieldError('confirmPassword')}</small>}
              </div>
            </div>
          </section>

          <div className="nu-actions end">
            <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creando…' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
