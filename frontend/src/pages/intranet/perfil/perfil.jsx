// src/pages/Perfil.jsx
import React from 'react';
import { useMe } from '../../../auth/useMe';

export default function Perfil() {
  const { me, loading } = useMe();
  if (loading) return <div className="page">Cargando…</div>;
  if (!me) return <div className="page">No se pudo cargar tu perfil.</div>;

  return (
    <div className="page">
      <h1>Perfil de usuario</h1>
      <div className="profile-grid">
        <div><strong>Nombre</strong><div>{me.nombre}</div></div>
        <div><strong>Correo</strong><div>{me.email}</div></div>
        <div><strong>Unidad</strong><div>{me.unidad || '—'}</div></div>
        <div><strong>Rol</strong><div>{me.rol || '—'}</div></div>
        <div><strong>Estado</strong><div>En línea</div></div>
      </div>
      {/* Aquí más tarde: cambiar contraseña, foto, preferencias, etc. */}
    </div>
  );
}
