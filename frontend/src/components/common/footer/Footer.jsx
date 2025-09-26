import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SocialIcons from "../SocialIcons/SocialIcons.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserTie,
  faUsers,
  faShieldHalved,
  faCoins,
  faDiagramProject,
  faScaleBalanced,
  faStethoscope,
  faBuilding,
  faGears
} from "@fortawesome/free-solid-svg-icons";
import "./Footer.css";

/* Mapa de iconos usados (puedes añadir más si los ocupas en el futuro) */
const ICONS = {
  "fa-user-tie": faUserTie,
  "fa-solid fa-gears": faGears,
  "fa-users": faUsers,
  "fa-shield-halved": faShieldHalved,
  "fa-coins": faCoins,
  "fa-diagram-project": faDiagramProject,
  "fa-scale-balanced": faScaleBalanced,
  "fa-stethoscope": faStethoscope,
  "fa-building": faBuilding,
};

/* Si en BD/array guardas "fa-solid fa-user-tie", esto extrae "fa-user-tie" */
function resolveIcon(icono_fa) {
  const parts = String(icono_fa || "")
    .split(/\s+/)
    .filter(Boolean);
  const key =
    parts.find((p) => p.startsWith("fa-") && p !== "fa-solid" && p !== "fa-regular" && p !== "fa-brands") ||
    "fa-building";
  return ICONS[key] || faBuilding;
}

const STATIC_FALLBACK = [
  { slug: "direccion-ejecutiva", nombre: "DIRECCIÓN EJECUTIVA", telefono: "+55 2 711 806", icono_fa: "fa-solid fa-user-tie" },
  { slug: "administracion", nombre: "ADMINISTRACIÓN", telefono: "+55 2 711 881", icono_fa: "fa-solid fa-gears" },
  { slug: "recursos-humanos", nombre: "RECURSOS HUMANOS", telefono: "+55 2 711 802", icono_fa: "fa-solid fa-users" },
  { slug: "control-interno", nombre: "CONTROL INTERNO", telefono: "+55 2 711 854", icono_fa: "fa-solid fa-shield-halved" },
  { slug: "control-institucional", nombre: "CONTROL INSTITUCIONAL", telefono: "+55 2 711 854", icono_fa: "fa-solid fa-shield-halved" },
  { slug: "finanzas", nombre: "FINANZAS", telefono: "+55 2 711 831", icono_fa: "fa-solid fa-coins" },
  { slug: "planificacion", nombre: "PLANIFICACIÓN", telefono: "+55 2 711 864", icono_fa: "fa-solid fa-diagram-project" },
  { slug: "asesoria-juridica", nombre: "ASESORÍA JURÍDICA", telefono: "+55 2 711 816", icono_fa: "fa-solid fa-scale-balanced" },
  { slug: "departamento-de-salud", nombre: "DEPARTAMENTO DE SALUD", telefono: "+55 2 540 418", icono_fa: "fa-solid fa-stethoscope" },
];

export default function Footer() {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch("/api/contactos/unidades");
        const j = await r.json().catch(() => []);
        if (!cancel) {
          const data = Array.isArray(j) ? j : [];
          setUnidades(
            data.length
              ? data.map((u) => ({
                  slug: u.slug,
                  nombre: (u.nombre || "").toUpperCase(),
                  telefono: u.telefono || "",
                  icono_fa: u.icono_fa || "fa-solid fa-building",
                }))
              : STATIC_FALLBACK
          );
        }
      } catch {
        if (!cancel) setUnidades(STATIC_FALLBACK);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <footer id="contactos" className="footer">
      <div className="footer-main">
        <div className="container">
          <div className="footer-content">
            <div className="footer-right glass">
              <div className="footer-contact">
                <h3 className="contact-title">Contáctanos</h3>

                {loading ? (
                  <div className="contact-loading">Cargando…</div>
                ) : (
                  <ul className="contact-list">
                    {unidades.map((u) => (
                      <li key={u.slug} className="contact-item">
                        <Link to={`/contactos/${u.slug}`} className="contact-link">
                          <div className="contact-left">
                            <FontAwesomeIcon
                              icon={resolveIcon(u.icono_fa)}
                              className="contact-ico"
                              aria-hidden="true"
                            />
                            <span className="contact-name">{u.nombre}</span>
                          </div>
                          {u.telefono ? <span className="contact-phone">{u.telefono}</span> : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="footer-social">
                <div className="follow-text">Síguenos en</div>
                <div className="social-icons"><SocialIcons /></div>
                <div className="logo-footer">
                  <img src="/assets/images/logo_comdes_blanco.png" alt="COMDES Calama" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-vignette" aria-hidden="true" />
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p className="copyright">CORPORACIÓN MUNICIPAL DE DESARROLLO SOCIAL CALAMA 2025</p>
        </div>
      </div>
    </footer>
  );
}
