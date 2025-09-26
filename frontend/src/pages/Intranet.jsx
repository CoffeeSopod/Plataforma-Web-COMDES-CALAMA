import "./intranet.css";
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { logout, getUser } from "../auth/auth";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../iconsRegistry';
import { faRightFromBracket, faUser } from '@fortawesome/free-solid-svg-icons';
import { useMe } from '../auth/useMe';
import ProfileQuickView from '../components/intranet/modal_perfil';

/* ===== Helper: Nombre corto para userbar ===== */
function getShortDisplayName(u) {
  if (!u) return "Usuario";

  // 1) Primer nombre: intenta 'primer_nombre', luego 'nombres'/'nombre'
  const rawFirst =
    (u.primer_nombre ?? u.nombres ?? u.nombre ?? "").toString().trim();
  const firstName = rawFirst ? rawFirst.split(/\s+/)[0] : "";

  // 2) Apellidos: usa campos separados si existen
  const apPat = (u.apellido_paterno ?? u.paterno ?? "").toString().trim();
  const apMat = (u.apellido_materno ?? u.materno ?? "").toString().trim();

  // 3) Arma resultado: "PrimerNombre ApellidoPaterno ApellidoMaterno"
  const lastPart = [apPat, apMat].filter(Boolean).join(" ").trim();
  const full = [firstName, lastPart].filter(Boolean).join(" ").trim();

  // 4) Fallback si no hay datos
  return full || "Usuario";
}

export default function Intranet() {
  const [showProfile, setShowProfile] = useState(false);
  const { me } = useMe();
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const [accesos, setAccesos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch('/api/shortcuts', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        if (cancel) return;
        setAccesos(data || []);
        setLoading(false);
        requestAnimationFrame(() => setLoaded(true));
      } catch (e) {
        console.error(e);
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  // Usa el helper (prioriza user; si no, me)
  const displayName = getShortDisplayName(user || me);

  return (
    <div className="intra-layout">
      {/* layout */}
      <ProfileQuickView
        open={showProfile}
        onClose={() => setShowProfile(false)}
        onFull={() => { setShowProfile(false); navigate('/perfil'); }}
        me={me}
      />

      {/* Columna izquierda */}
      <aside className="tablon-avisos">
        <div className="box">
          <h2 className="panel-title">Tablón de avisos</h2>
          <p className="panel-desc">
            Últimas comunicaciones internas, recordatorios y novedades de COMDES.
            Mantente al día con lo más importante de tu área.
          </p>
          <ul className="bullet-list">
            <li>🗓️ Reunión trimestral – viernes 10:00</li>
            <li>📢 Nuevo procedimiento de soporte TI</li>
            <li>✅ Cierre de reportes mensuales: 28 de cada mes</li>
          </ul>
        </div>
      </aside>

      {/* Columna central */}
      <main className="col-center">
        {/* Perfil */}
        <div className="userbar">
          <div className="userbar-left">
            <FontAwesomeIcon icon={faUser} />
            <div className="user-meta">
              {/* <<< Aquí el cambio >>> */}
              <strong className="user-name">{displayName}</strong>
              <span className="user-unit">{user?.unidad || "Unidad"}</span>
            </div>
            <span className="user-status is-online">● En línea</span>
          </div>
          <div className="userbar-actions">
            <button className="btn-ghost" onClick={() => setShowProfile(true)}>
              Ver perfil
            </button>
            <button className="btn-danger" onClick={handleLogout}>
              <FontAwesomeIcon icon={faRightFromBracket} /> 
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Banner Intranet */}
        <section className="banner-intranet">
          <img
            src="/assets/images/intranet/banner_intranet_bienvenida.png"
            alt="Bienvenido a la intranet COMDES"
          />
        </section>

        {/* Accesos directos */}
        <section className="accesos-directos">
          <header className="section-header">
            <h2>Accesos directos</h2>
            <p>Herramientas y portales de uso frecuente.</p>
          </header>

          {loading ? (
            <div className="cards-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="access-card skeleton">
                  <div className="access-skel-body">
                    <div className="sk-line sk-line--title"></div>
                    <div className="sk-line sk-line--desc"></div>
                  </div>
                  <div className="sk-icon"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`cards-grid ${loaded ? 'is-loaded' : ''}`}>
              {accesos.map((card, idx) => {
                const IconComp = ICONS?.[card.icon_name];
                const body = (
                  <>
                    <div className="access-body">
                      <h3>{card.titulo}</h3>
                      <p>{card.descripcion}</p>
                    </div>
                    {IconComp
                      ? <FontAwesomeIcon icon={IconComp} className="access-icon" />
                      : <FontAwesomeIcon icon={['fas', 'link']} className="access-icon" />
                    }
                  </>
                );

                const commonProps = {
                  className: "access-card",
                  style: { '--i': idx }
                };

                return card.externo ? (
                  <a key={card.id} {...commonProps} href={card.url} target="_blank" rel="noreferrer">
                    {body}
                  </a>
                ) : (
                  <Link key={card.id} {...commonProps} to={card.url}>
                    {body}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
