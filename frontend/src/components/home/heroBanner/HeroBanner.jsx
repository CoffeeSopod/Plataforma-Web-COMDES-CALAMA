import React, { useEffect, useMemo, useState } from "react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import "./HeroBanner.css";

/* --- Autoplay plugin (pausa en hover/focus) --- */
const Autoplay = (slider, { delay = 5000 } = {}) => {
  let timeout;
  let mouseOver = false;
  const clearNextTimeout = () => clearTimeout(timeout);
  const nextTimeout = () => {
    clearTimeout(timeout);
    if (!mouseOver) timeout = setTimeout(() => slider.next(), delay);
  };
  slider.on("created", () => {
    slider.container.addEventListener("mouseover", () => { mouseOver = true; clearNextTimeout(); });
    slider.container.addEventListener("mouseout", () => { mouseOver = false; nextTimeout(); });
    slider.container.addEventListener("focusin", clearNextTimeout);
    slider.container.addEventListener("focusout", nextTimeout);
    nextTimeout();
  });
  slider.on("dragStarted", clearNextTimeout);
  slider.on("animationEnded", nextTimeout);
  slider.on("updated", nextTimeout);
};

/* --- Marca el slide activo (para Ken Burns en CSS) --- */
const KenBurns = (slider) => {
  const setActive = () => {
    slider.slides.forEach((s) => s.classList.remove("is-active"));
    const active = slider.slides[slider.track.details.rel];
    if (active) active.classList.add("is-active");
  };

  slider.on("created", setActive);
  slider.on("slideChanged", setActive);
};

/* --- Fallback local por si /api/banners falla --- */
const FALLBACK = [
  {
    id: 1,
    title: "COMIENZA LA VACUNACIÓN",
    subtitle: "contra la influenza en Calama",
    description:
      "El 1 de marzo comenzó oficialmente la «Campaña de Vacunación contra la Influenza».",
    media: {
      type: "imagen",
      desktop: "/assets/images/banners/vacunacion.jpg",
      tablet: "/assets/images/banners/vacunacion.jpg",
      mobile: "/assets/images/banners/vacunacion.jpg",
    },
    redirect: { mode: "Ninguno", href: null },
    orden: 1,
  },
];

/* --- Mapea el row de la API al formato usado en el componente --- */
function mapBannerRow(row) {
  // API esperada desde /api/banners (según router sugerido):
  // { id, title, subtitle, description, media:{type,desktop,tablet,mobile}, redirect:{mode,href}, orden }
  if (row?.media) return row;

  // Por si el endpoint aún devuelve nombres crudos de la tabla:
  const tipo = row?.tipo_media || "imagen";
  let href = null;
  if (row?.tipo_redir === "Enlace web" && row?.redir_valor) href = row.redir_valor;
  if (row?.tipo_redir === "Sección" && row?.redir_valor) href = `/${String(row.redir_valor).replace(/^\/+/, "")}`;

  return {
    id: row.id,
    title: row.titulo,
    subtitle: row.subtitulo,
    description: row.descripcion,
    media: {
      type: tipo, // 'imagen' | 'video'
      desktop: row.url_media_desktop,
      tablet: row.url_media_tablet,
      mobile: row.url_media_cell || row.url_media_tablet || row.url_media_desktop,
    },
    redirect: { mode: row.tipo_redir || "Ninguno", href },
    orden: row.orden ?? 9999,
  };
}

/* --- Slide: renderiza imagen (picture) o video y el contenido --- */
function Slide({ item }) {
  const { media, title, subtitle, description, redirect } = item;
  const isVideo = media?.type === "video";

  // imagen para el blur de fondo: prioriza poster -> desktop -> tablet -> mobile
  const bgImg = media?.poster || media?.desktop || media?.tablet || media?.mobile;

  const bodyMedia = isVideo ? (
    <video
      className={`banner-media${isVideo ? " no-kenburns" : ""}`}
      src={media.desktop || media.tablet || media.mobile}
      poster={media.poster || undefined}
      autoPlay
      muted
      loop
      playsInline
    />
  ) : (
    <picture className="banner-picture">
      {media?.desktop && <source media="(min-width: 1024px)" srcSet={media.desktop} />}
      {media?.tablet && <source media="(min-width: 640px)" srcSet={media.tablet} />}
      <img
        className="banner-media"
        src={media?.mobile || media?.tablet || media?.desktop}
        alt={title || "Banner"}
        loading="eager"
      />
    </picture>
  );

  const content = (
    <>
      {/* si quieres dejar el degradé, añade un background en .banner-overlay del CSS */}
      <div className="banner-overlay"></div>
      <div className="container">
        <div className="banner-text">
          {title && (
            <h1>
              <span className="banner-highlight">{title}</span>
              {subtitle}
            </h1>
          )}
          {description && <p>{description}</p>}
        </div>
      </div>
    </>
  );

  const contentBlock = (
    <div
      className={`banner-content${isVideo ? " is-video" : ""}`}
      style={{ "--bg-img": bgImg ? `url(${bgImg})` : "none" }}
    >
      {bodyMedia}
      {content}
    </div>
  );

  // Slide clickeable según tipo_redir
  if (redirect?.mode !== "Ninguno" && redirect?.href) {
    const isExternal = /^https?:\/\//i.test(redirect.href);
    return (
      <a
        className="keen-slider__slide"
        href={redirect.href}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {contentBlock}
      </a>
    );
  }

  return <div className="keen-slider__slide">{contentBlock}</div>;
}


const HeroBanner = () => {
  const [banners, setBanners] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [sliderRef, instanceRef] = useKeenSlider(
    {
      loop: true,
      renderMode: "performance",
      slides: { perView: 1 },
      defaultAnimation: { duration: 900, easing: (t) => 1 - Math.pow(1 - t, 3) },
      slideChanged(s) {
        setActiveIndex(s.track.details.rel);
      },
    },
    [Autoplay, KenBurns]
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/banners");
        const json = await res.json();
        if (!alive) return;

        if (json?.ok && Array.isArray(json.data) && json.data.length) {
          const mapped = json.data.map(mapBannerRow).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
          setBanners(mapped);
        } else {
          setBanners(FALLBACK);
        }
      } catch (e) {
        console.error("Error cargando banners:", e);
        setBanners(FALLBACK);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const total = useMemo(() => banners.length, [banners]);

  const handleIndicatorClick = (index) => {
    const inst = instanceRef.current;
    if (inst) inst.moveToIdx(index);
  };

  if (loading) {
    return (
      <section className="hero-banner hero-banner--loading">
        <div className="banner-skeleton" />
      </section>
    );
  }

  if (!total) return null;

  return (
    <section className="hero-banner">
      {/* Contenedor Keen */}
      <div ref={sliderRef} className="keen-slider banner-slider">
        {banners.map((b) => (
          <Slide key={b.id} item={b} />
        ))}
      </div>

      {/* Indicadores */}
      <div className="banner-indicators">
        {banners.map((b, idx) => (
          <button
            key={b.id}
            className={`indicator ${idx === activeIndex ? "active" : ""}`}
            onClick={() => handleIndicatorClick(idx)}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroBanner;
