import React from 'react';
import { Outlet } from 'react-router-dom';
import './AuthLayout.css'; // opcional

export default function AuthLayout() {
  return (
    <div className="auth-shell">
      <Outlet />
    </div>
  );
}
