import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
import './enlaces_salud.css';

/* ===== Helpers para URLs ===== */
// "Cesfam Enrique Montt" -> "cesfam-enrique-montt"
const toSlug = (s = '') =>
  s
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita acentos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

const resolveUrl = (service, link) => {
  // Para el grupo CESFAM: usa layout modular
  if (service?.id === 'cesfam') {
    const slug = link.slug || toSlug(link.name);
    return `/centros/${slug}`;
  }

  if (service?.id === 'cecosf') {
    const slug = link.slug || toSlug(link.name);
    return `/centros/${slug}`;
  }

  if (service?.id === 'sar') {
    const slug = link.slug || toSlug(link.name);
    return `/centros/${slug}`;
  }
  // Para los demás grupos: respeta el url existente
  return link.url || '#';
};
/* ================================== */

const serviceData = [
  {
    id: 'cesfam',
    title: 'CESFAM',
    image: '/assets/images/services/cesfam_icono.png',
    links: [
      {
        name: 'Cesfam Central',
        url: '',
        image: '/assets/images/services/banner_cesfam/banner_cesfam_central.png'
      },
      {
        name: 'Cesfam Alemania',
        url: '',
        image: '/assets/images/services/banner_cesfam/banner_cesfam_alemania.png'
      },
      {
        name: 'Cesfam Norporiente',
        url: '',
        image: '/assets/images/services/banner_cesfam/banner_cesfam_norporiente.png'
      },
      {
        name: 'Cesfam Enrique Montt',
        url: '',
        image: '/assets/images/services/banner_cesfam/banner_cesfam_montt.png'
      }
    ]
  },
  {
    id: 'cecosf',
    title: 'CECOSF',
    image: '/assets/images/services/cecosf_icono.png',
    links: [
      {
        name: 'Cecosf Sur',
        url: '',
        image: '/assets/images/services/banner_cecosf/banner_cecosf_sur.png'
      },
      {
        name: 'Cecosf Alemania',
        url: '',
        image: '/assets/images/services/banner_cecosf/banner_cecosf_alemania.png'
      },
      {
        name: 'Cecosf Oasis',
        url: '',
        image: '/assets/images/services/banner_cecosf/banner_cecosf_oasis.png'
      }
    ]
  },
  {
    id: 'sar',
    title: 'SAR',
    image: '/assets/images/services/sar_icono.png',
    links: [
      {
        name: 'Sar Alemania',
        url: '',
        image: '/assets/images/services/banner_sar/banner.png'
      },
    ]
  },
  {
    id: 'transversales',
    title: 'UNIDADES TRANSVERSALES',
    image: '/assets/images/services/transversales_icono.png',
    links: [
      {
        name: 'Farmacia',
        url: '/transversales/farmacia',
        image: '/assets/images/links/transversales/farmacia_bg.png'
      },
      {
        name: 'Laboratorio',
        url: '/transversales/laboratorio',
        image: '/assets/images/links/transversales/laboratorio_bg.png'
      }
    ]
  }
];

const EnlacesSalud = () => {
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const handleOpen = (service) => {
    setSelected(service);
    setShow(true);
  };

  const handleClose = () => {
    setShow(false);
    setSelected(null);
  };

  return (
    <>
      <section className="service-blocks">
        <div className="container">
          <div className="blocks-container">
            {serviceData.map((service) => (
              <div
                key={service.id}
                className="service-block"
                style={{ backgroundImage: `url(${service.image})` }}
                onClick={() => handleOpen(service)}
              >
                <h3 className="block-title">{service.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Modal
        show={show}
        onHide={handleClose}
        centered
        container={document.body}
        size="lg"
        dialogClassName="custom-modal"
      >
        <Modal.Header closeButton className="custom-modal-header">
          <Modal.Title>{selected?.title}</Modal.Title>
        </Modal.Header>

        <Modal.Body className="custom-modal-body">
          <div className="links-grid">
            {selected?.links.map((link) => (
              <div
                key={link.name} /* evita key vacía si url = '' */
                className="link-block"
                style={{ backgroundImage: `url(${link.image})` }}
                onClick={() => {
                  const url = resolveUrl(selected, link);
                  if (/^https?:\/\//i.test(url)) {
                    window.open(url, '_blank', 'noopener,noreferrer');
                  } else {
                    navigate(url);
                  }
                }}
              />
            ))}
          </div>
        </Modal.Body>

        <Modal.Footer className="custom-modal-footer">
          <Button variant="outline-secondary" onClick={handleClose}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EnlacesSalud;
