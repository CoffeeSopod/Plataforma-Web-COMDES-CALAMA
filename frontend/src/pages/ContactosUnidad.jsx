// src/contactos/ContactosUnidad.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { FontAwesomeIcon, resolveIcon, ICONS } from "../iconsRegistry";
import "./contactos.css";

/* ============ Helpers ============ */
function sanitizePhone(tel = "") {
  const trimmed = String(tel).trim();
  const keepPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  return keepPlus ? `+${digits}` : digits;
}
function safeMail(mail = "") {
  return String(mail).trim();
}

/* ============ Avatares ============ */
function AvatarBase({ src, alt, className }) {
  const [ok, setOk] = useState(true);
  const url = ok && src ? src : "/assets/images/unidades/avatar/placeholder.png";
  return (
    <img
      className={className}
      src={url}
      alt={alt || "avatar"}
      onError={() => setOk(false)}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
    />
  );
}
const AvatarEncargado = (props) => (
  <AvatarBase {...props} className="ct-avatar ct-avatar-encargado" />
);
const AvatarMiembro = (props) => (
  <AvatarBase {...props} className="ct-avatar ct-avatar-miembro" />
);

/* ============ Vista principal ============ */
export default function ContactosUnidad() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const { pathname } = useLocation();

  /* --- FIX: ir siempre al inicio al cambiar de sección/unidad --- */
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [pathname, slug]);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const r = await fetch(`/api/contactos/${encodeURIComponent(slug)}`, {
          signal: ctrl.signal,
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.message || "No se pudo cargar la unidad.");
        setData(j);
      } catch (e) {
        if (e.name !== "AbortError") setErr(e.message || "Error desconocido.");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [slug]);

  const unidad = data?.unidad || {};
  const encargado = data?.encargado || null;
  const equipo = useMemo(() => (Array.isArray(data?.equipo) ? data.equipo : []), [data]);

  if (loading) {
    return (
      <div className="ct-shell">
        <div className="ct-hero ct-skeleton-hero" aria-hidden />
        <section className="ct-section">
          <div className="ct-subtitle ct-skeleton-line" />
          <div className="ct-lead-card ct-skeleton-card" />
        </section>
        <section className="ct-section soft">
          <div className="ct-subtitle ct-skeleton-line" />
          <div className="ct-grid">
            <div className="ct-card ct-skeleton-card" />
            <div className="ct-card ct-skeleton-card" />
            <div className="ct-card ct-skeleton-card" />
          </div>
        </section>
      </div>
    );
  }

  if (err) {
    return (
      <div className="ct-shell">
        <div className="ct-alert error" role="alert">
          <strong>Error:</strong> {err}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="ct-shell">
      {/* Banner como estaba: sin sangrado ni márgenes extra */}
      <header
        className="ct-hero"
        style={{ backgroundImage: unidad.bg_url ? `url(${unidad.bg_url})` : undefined }}
        aria-label={`Unidad ${unidad?.nombre || ""}`}
      >
        <div className="ct-hero-overlay" />
        <div className="ct-hero-content">
          <FontAwesomeIcon
            icon={resolveIcon(unidad?.icono_fa)}
            className="ct-icon"
            aria-hidden
          />
          <h1 className="ct-hero-title">{unidad?.nombre || "Unidad"}</h1>
        </div>

        <div className="colores-barra" aria-hidden="true" role="presentation">
          <span className="barra stripe-purple"></span>
          <span className="barra stripe-blue"></span>
          <span className="barra stripe-green"></span>
          <span className="barra stripe-white"></span>
          <span className="barra stripe-yellow"></span>
          <span className="barra stripe-orange"></span>
          <span className="barra stripe-red"></span>
        </div>
      </header>

      <div className="ct-cards">
        {/* Encargad@ */}
        <section className="ct-section">
          <h2 className="ct-subtitle">Encargad@</h2>

          {encargado ? (
          <article
            className="ct-lead-card ct-redesign"
            style={{ '--lead-bg': `url('/assets/images/unidades/leader_card.png')` }}
            aria-labelledby="lead-name"
          >
            {/* Badge de cargo (derecha con borde izq redondeado) */}
            {encargado.cargo && (
              <div className="ct-badge" role="note">
                {encargado.cargo}
              </div>
            )}

            <div className="ct-lead-photo">
              <AvatarEncargado src={encargado.avatar_url} alt={encargado.nombre} />
            </div>

            <div className="ct-lead-info">
              <div id="lead-name" className="ct-name">{encargado.nombre}</div>

              <ul className="ct-list">
                {encargado.telefono && (
                  <li className="ct-chip">
                    <FontAwesomeIcon icon={ICONS.phone} aria-hidden />
                    <a className="ct-chip-text" href={`tel:${sanitizePhone(encargado.telefono)}`}>
                      {encargado.telefono}
                    </a>
                  </li>
                )}
                {encargado.email && (
                  <li className="ct-chip">
                    <FontAwesomeIcon icon={ICONS.envelope} aria-hidden />
                    <a className="ct-chip-text" href={`mailto:${safeMail(encargado.email)}`}>
                      {safeMail(encargado.email)}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </article>

          ) : (
            <div className="ct-muted">Esta unidad no tiene encargad@ asignad@.</div>
          )}
        </section>

        {/* Equipo */}
        <section className="ct-section soft">
          <h2 className="ct-subtitle">Equipo de trabajo</h2>

          {equipo.length === 0 ? (
            <div className="ct-muted">Esta unidad no tiene integrantes cargados.</div>
          ) : (
            <div className="ct-grid">
              {equipo.map((p) => {
                const mail = p?.email ? safeMail(p.email) : "";
                const tel = p?.telefono ? sanitizePhone(p.telefono) : "";
                return (
                  <article className="ct-card ct-member">
                    <div className="ct-card-top">
                      <AvatarMiembro src={p?.avatar_url} alt={p?.nombre} />
                    </div>

                    <div className="ct-card-body">
                      <div className="ct-name">{p?.nombre || "Sin nombre"}</div>
                      {p?.cargo && <div className="ct-role">{p.cargo}</div>}

                      <ul className="ct-list">
                        {tel && (
                          <li className="ct-chip">
                            <FontAwesomeIcon icon={ICONS.phone} aria-hidden />
                            <a className="ct-chip-text" href={`tel:${tel}`}>{p.telefono}</a>
                          </li>
                        )}
                        {mail && (
                          <li className="ct-chip">
                            <FontAwesomeIcon icon={ICONS.envelope} aria-hidden />
                            <a className="ct-chip-text" href={`mailto:${mail}`}>{mail}</a>
                          </li>
                        )}
                      </ul>
                    </div>
                  </article>

                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
