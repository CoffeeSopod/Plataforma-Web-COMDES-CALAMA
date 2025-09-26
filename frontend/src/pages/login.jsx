import React, { useEffect, useState } from 'react';
import './login.css';
import { useNavigate } from "react-router-dom";

const Login = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [okMsg, setOkMsg] = useState('');

  useEffect(() => {
    // precargar email si el usuario marcó "Recuérdame" antes
    const savedEmail = localStorage.getItem('remember_email');
    if (savedEmail) setForm(f => ({ ...f, email: savedEmail, remember: true }));
  }, []);

  const handleChange = (e) => {
    const { id, type, checked, value } = e.target;
    if (id === 'email' || id === 'password') setForm(f => ({ ...f, [id]: value }));
    if (type === 'checkbox') setForm(f => ({ ...f, remember: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setOkMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), password: form.password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Error de autenticación');
      }

      // Guardar token (opción simple). Para producción, prefiere cookies httpOnly.
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (form.remember) localStorage.setItem('remember_email', form.email.trim());
      else localStorage.removeItem('remember_email');

      setOkMsg('¡Inicio de sesión exitoso! Redirigiendo…');
      setTimeout(() => navigate('/intranet'), 600);

    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Columna izquierda */}
      <div className="login-left">
        <div className="overlay"></div>
        <div className="left-content">
          <span className="welcome-badge">¡BIENVENID@!</span>
          <h1>Inicia sesión para acceder a las herramientas de tu área.</h1>
        </div>
      </div>

      {/* Columna derecha */}
      <div className="login-right">
        <div className="form-card">
          <img className="logo_intranet" src="/assets/images/login/logo_intranet.png" alt="Intranet COMDES"></img>
          <h2>Inicio de sesión</h2>

          {/* Alertas */}
          {err && <div className="alert error">{err}</div>}
          {okMsg && <div className="alert success">{okMsg}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="email">Correo institucional</label>
            <input
              id="email"
              type="email"
              placeholder="correo@comdescalama.cl"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />

            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="********"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />

            <div className="row-between">
              <label className="remember">
                <input type="checkbox" checked={form.remember} onChange={handleChange} /> Recuérdame
              </label>
              <a href="#">¿Olvidaste tu contraseña?</a>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
