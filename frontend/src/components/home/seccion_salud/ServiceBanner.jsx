// src/components/home/ServiceBlocks/ServiceBanner.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";

import "./ServiceBanner.css";   // tu CSS de banner

/* === Carrusel reutilizable === */
function MedsCarouselKeen({ items = [] }) {
  const [ref, slider] = useKeenSlider({
    loop: true,
    rubberband: false,
    slides: { perView: 4, spacing: 16 },
    breakpoints: {
      "(max-width: 992px)" : { slides: { perView: 2, spacing: 14 } },
      "(max-width: 560px)" : { slides: { perView: 1, spacing: 12 } },
    },
  });

  const prev = () => slider?.current?.prev();
  const next = () => slider?.current?.next();

  return (
    <div className="meds-keen">
      <div ref={ref} className="keen-slider">
        {items.map((m) => (
          <div key={m.id} className="keen-slider__slide">
            <article className="med-item" title={m.nombre}>
              <div className="med-thumb">
                
                <img
                  src={m.img}
                  alt={m.nombre}
                  width={800}
                  height={600}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src =
                      "/assets/images/farmacia/medicamento/placeholder.png";
                  }}
                />
              </div>
              <div className="med-body">
                <div className="med-name">{m.nombre}</div>
                {m.princ_act && <div className="med-sub muted">{m.princ_act}</div>}
                <span className={`stock-badge ${m.stockClass}`}>{m.stockLabel}</span>
              </div>
            </article>
          </div>
        ))}
      </div>

      <button className="nav-btn nav-prev" onClick={prev} aria-label="Ver anteriores">
        ‹
      </button>
      <button className="nav-btn nav-next" onClick={next} aria-label="Ver siguientes">
        ›
      </button>
    </div>
  );
}

/* === ServiceBanner con carrusel debajo === */
const ServiceBanner = () => {
  const [meds, setMeds] = useState({ items: [], loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const params = new URLSearchParams({
          page: "1",
          pageSize: "15",
          sort: "nombre",
          dir: "asc",
        });
        const res = await fetch(`/api/inventario?${params.toString()}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok)
          throw new Error(json?.message || "Error cargando inventario");

        const rows = Array.isArray(json.rows) ? json.rows : [];
        setMeds({ items: rows, loading: false, error: null });
      } catch (e) {
        if (e.name !== "AbortError") {
          setMeds({
            items: [],
            loading: false,
            error: "No se pudo cargar el inventario",
          });
        }
      }
    })();
    return () => controller.abort();
  }, []);

  const cards = useMemo(() => {
    const list = meds.items
      .filter((m) => (m.estado || "visible") === "visible")
      .map((m) => {
        const cantidad = Number(m.stock_total ?? m.cantidad ?? 0);
        let stockLabel = "Sin existencias";
        let stockClass = "stock-none";
        if (cantidad >= 50) {
          stockLabel = "En stock";
          stockClass = "stock-ok";
        } else if (cantidad > 0 && cantidad <= 20) {
          stockLabel = "Stock limitado";
          stockClass = "stock-low";
        } else if (cantidad > 20 && cantidad < 50) {
          stockLabel = "En stock";
          stockClass = "stock-mid";
        }

        return {
          id: m.id,
          nombre: m.nombre,
          princ_act: m.princ_act || "",
          img:
            m.img ||
            "/assets/images/farmacia/medicamento/placeholder.png",
          stockLabel,
          stockClass,
        };
      });

    const rank = { "stock-ok": 3, "stock-mid": 2, "stock-low": 1, "stock-none": 0 };
    return list.sort(
      (a, b) =>
        rank[b.stockClass] - rank[a.stockClass] ||
        a.nombre.localeCompare(b.nombre)
    );
  }, [meds.items]);

  return (
    <section id="centros" className="service-banner">
      <div className="container">
        {/* Banner Farmacia Ciudadana */}
        <div className="fc-hero">
          <div className="fc-band" aria-hidden />
          <div className="fc-inner">
            <img
              className="fc-logo"
              src="/assets/images/centros/u_tran/farmacia_ciudadana/logo.png"
              alt="Farmacia Ciudadana"
              loading="lazy"
              decoding="async"
            />

            <h2 className="fc-title" aria-label="Farmacia Ciudadana">
              <span className="fc-farmacia">FARMACIA</span>
              <span className="fc-ciudadana">CIUDADANA</span>
            </h2>

            <Link to="/centros/farmacia-ciudadana" className="fc-cta">
              Ver catálogo
            </Link>
          </div>
        </div>


        {/* Carrusel debajo */}
        <div className="meds-block">
          <div className="meds-head">
            <h3>Productos destacados</h3>
          </div>

          {meds.loading && <div className="meds-skeleton">Cargando…</div>}
          {meds.error && <div className="meds-error">{meds.error}</div>}
          {!meds.loading && !meds.error && cards.length > 0 && (
            <MedsCarouselKeen items={cards} />
          )}
          {!meds.loading && !meds.error && cards.length === 0 && (
            <div className="meds-empty">No hay productos visibles.</div>
          )}

        </div>
      </div>
    </section>
  );
};

export default ServiceBanner;
