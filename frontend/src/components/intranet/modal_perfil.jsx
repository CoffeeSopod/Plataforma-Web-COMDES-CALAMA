// src/components/ProfileQuickView.jsx
import React from 'react';
import './modal_perfil.css';

export default function ProfileQuickView({ open, onClose, onFull, me }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose} aria-hidden="true">
      <div className="modal-card" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h3>Mi perfil</h3>
          <button className="close" onClick={onClose} aria-label="Cerrar">×</button>
        </header>
        <div className="modal-body">
          {!me ? <p>Cargando…</p> : (
            <ul className="profile-list">
              <li><strong>Nombre:</strong> {me.nombre}</li>
              <li><strong>Correo:</strong> {me.email}</li>
              <li><strong>Unidad:</strong> {me.unidad || '—'}</li>
              <li><strong>Rol:</strong> {me.rol || '—'}</li>
              <li><strong>Estado:</strong> En línea</li>
            </ul>
          )}
        </div>
        <footer className="modal-actions">
          <button className="btn-ghost" onClick={onFull}>Perfil completo</button>
          <button className="btn-primary" onClick={onClose}>Cerrar</button>
        </footer>
      </div>
    </div>
  );
}
