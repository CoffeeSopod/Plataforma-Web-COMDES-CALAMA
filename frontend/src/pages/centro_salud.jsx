import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import './centro_salud.css';
import FarmaciaCiudadanaPage from "./FarmaciaCiudadana";

/* === Helper: respeta \n, \r\n como saltos de línea y párrafos === */
function MultiText({ text, className = 'multiline', as = 'p' }) {
  if (!text) return null;
  const Tag = as;
  const norm = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const blocks = norm.split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        return (
          <Tag key={i} className={className}>
            {lines.map((line, j) => (
              <React.Fragment key={j}>
                {line}
                {j < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </Tag>
        );
      })}
    </>
  );
}

/* === Helpers: Sanitización de mapa === */
const ALLOWED_MAP_HOSTS = new Set([
  'www.google.com',
  'maps.google.com',
  'www.google.cl',
  'maps.app.goo.gl' // deep links
]);

function extractIframeSrc(html) {
  const m = String(html).match(/<iframe[^>]*\s+src=["']([^"']+)["'][^>]*>/i);
  return m ? m[1] : null;
}

function isAllowedMapUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    return ALLOWED_MAP_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

/* === Mapa: acepta <iframe ...> o una URL embed limpia; sanea y reconstruye === */
function MapEmbed({ embed }) {
  if (!embed) return <div className="map-placeholder">Mapa próximamente</div>;

  let src = embed;
  if (/<iframe/i.test(embed)) {
    const s = extractIframeSrc(embed);
    if (s) src = s;
  }

  if (!isAllowedMapUrl(src)) {
    return (
      <div className="map-placeholder">
        Mapa no disponible (URL no permitida).
      </div>
    );
  }

  return (
    <div className="map-embed">
      <iframe
        src={src}
        loading="lazy"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-popups"
        referrerPolicy="no-referrer-when-downgrade"
        title="Ubicación en Google Maps"
      />
    </div>
  );
}

export default function CentroPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoaded(false);

    (async () => {
      try {
        const res = await fetch(`/api/centros/${slug}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          signal: controller.signal
        });
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        setData(json);
        setLoading(false);
        requestAnimationFrame(() => setLoaded(true));
      } catch (e) {
        if (e.name === 'AbortError') return;
        setData(null);
        setLoading(false);
        // opcional: si e.message === '401' -> redirigir a /login
      }
    })();

    return () => controller.abort();
  }, [slug]);

  if (loading) return <CentroSkeleton />;

  if (!data) {
    return (
      <div className="centro-wrap">
        <div className="error-card">
          <h2>Centro no encontrado</h2>
          <p>Revisa el enlace o vuelve al listado.</p>
          <Link to="/centros" className="btn">Volver</Link>
        </div>
      </div>
    );
  }

  const nombreEncargado = [data.nombres_e, data.ap_pat_e, data.ap_mat_e].filter(Boolean).join(' ');
  const misionBg = '/assets/images/about/mision.PNG';
  const visionBg = '/assets/images/about/vision.PNG';
  const avatarSrc = data.url_avatar || '/assets/images/unidades/avatar/placeholder.png';

  return (
    <div className={`centro-wrap ${loaded ? 'is-loaded' : ''}`}>
      {/* =========== HERO =========== */}
      <section className="hero" style={{ '--hero': `url(${data.url_banner || ''})` }}>
        <div className="hero-overlay">
          <div className="container hero-inner">
            {data.url_logo && (
              <img
                className="hero-logo"
                src={data.url_logo}
                alt={data.nombre_salud}
                loading="lazy"
                decoding="async"
              />
            )}
            <div className="hero-title">
              <span className="hero-sub">CENTRO DE SALUD</span>
              <h1>{data.nombre_salud}</h1>
            </div>

            <div className="topbar-stripes" aria-hidden="true" role="presentation">
              <span className="stripe stripe-purple"></span>
              <span className="stripe stripe-blue"></span>
              <span className="stripe stripe-green"></span>
              <span className="stripe stripe-white"></span>
              <span className="stripe stripe-yellow"></span>
              <span className="stripe stripe-orange"></span>
              <span className="stripe stripe-red"></span>
            </div>
          </div>
        </div>
      </section>

      {/* ====== CONTENEDOR 1: Encargado + Horario + Quiénes somos ====== */}
      <section className="centro-section">
        <div className="container cluster-info">
          {/* Encargado */}
          <article
            className="card card--encargado"
            style={{ '--card-bg': `url('/assets/images/centros/card_design.png')` }}
          >
            {/* Etiqueta de cargo (alineada a la derecha, con borde izquierdo redondeado) */}
            { (data.cargo_e || '').trim() && (
              <div className="enc-badge" role="note" aria-label="Cargo">
                {data.cargo_e}
              </div>
            )}

            <div className="enc-main">
              <figure className="enc-photo" aria-hidden="true">
                <img
                  className="enc-avatar"
                  src={avatarSrc}
                  alt={`Foto de ${nombreEncargado || 'encargado/a'}`}
                  loading="lazy"
                  decoding="async"
                />
              </figure>

              <div className="enc-info">
                <h2 className="enc-name">
                  {nombreEncargado || 'Encargad@ por confirmar'}
                </h2>

                {data.telefono && (
                  <div className="row chip">
                    <FontAwesomeIcon icon={faPhone} className="ico" aria-hidden />
                    <span className="chip-text">{data.telefono}</span>
                  </div>
                )}

                {data.correo && (
                  <div className="row chip">
                    <FontAwesomeIcon icon={faEnvelope} className="ico" aria-hidden />
                    <span className="chip-text">{data.correo}</span>
                  </div>
                )}
              </div>
            </div>
          </article>


          {/* Horario */}
          <article className="card card--horario" aria-labelledby="titulo-horario">
            <div className="horario-icon">
              <div className="clock-pill" aria-hidden>
                <FontAwesomeIcon icon={faClock} />
              </div>
            </div>
            <div className="horario-body">
              <h3 id="titulo-horario">HORARIO DE ATENCIÓN</h3>
              <MultiText text={data.h_atencion} />
            </div>
          </article>

          {/* Quiénes somos */}
          <article className="card card--qs">
            <h3>QUIÉNES SOMOS</h3>
            <MultiText text={data.quienes_somos} />
          </article>
        </div>
      </section>

      {/* ====== CONTENEDOR 2: Misión y Visión ====== */}
      <section className="centro-section">
        <div className="container cluster-mv">
          <article className="card mv-card" style={{ '--bg': `url(${misionBg})` }}>
            <h3>NUESTRA MISIÓN</h3>
            <MultiText text={data.mision} />
          </article>
          <article className="card mv-card" style={{ '--bg': `url(${visionBg})` }}>
            <h3>NUESTRA VISIÓN</h3>
            <MultiText text={data.vision} />
          </article>
        </div>
      </section>

      {/* ====== CONTENEDOR 3: Dirección + Mapa + Fachada ====== */}
      <section className="centro-section">
        <div className="container cluster-dir">
          <article className="card card--direccion">
            <h3>DIRECCIÓN DE NUESTRO ESTABLECIMIENTO</h3>
            {data.direccion && <div className="dir-pill">📍 {data.direccion}</div>}
            <div className="dir-grid">
              <MapEmbed embed={data.mapa_embed} />
              {data.url_frente ? (
                <img
                  className="front-photo"
                  src={data.url_frente}
                  alt={`Fachada ${data.nombre_salud}`}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="front-placeholder">Foto próximamente</div>
              )}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

/* Skeleton */
function CentroSkeleton() {
  return (
    <div className="centro-wrap sk">
      <div className="hero sk-box" />
      <section className="centro-section">
        <div className="container cluster-info">
          <div className="card sk-box" style={{ height: 180 }} />
          <div className="card sk-box" style={{ height: 180 }} />
          <div className="card sk-box" style={{ height: 260 }} />
        </div>
      </section>
      <section className="centro-section">
        <div className="container cluster-mv">
          <div className="card sk-box" style={{ height: 220 }} />
          <div className="card sk-box" style={{ height: 220 }} />
        </div>
      </section>
      <section className="centro-section">
        <div className="container cluster-dir">
          <div className="card sk-box" style={{ height: 360 }} />
        </div>
      </section>
    </div>
  );
}
