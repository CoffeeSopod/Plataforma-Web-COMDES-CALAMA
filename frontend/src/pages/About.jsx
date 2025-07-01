import React, { useEffect } from 'react';
import './About.css';

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-page">
      <div className="page-banner">
        <div className="container">
          <h1 className="page-title">Quienes Somos</h1>
        </div>
      </div>

      <section className="about-section">
        <div className="container">
          <div className="about-content">
            <div className="about-image">
              <img src="/assets/images/about/comdes_fachada.jpeg" alt="Edificio COMDES Calama" />
            </div>
            <div className="about-text">
              <h2>Historia de COMDES Calama</h2>
              <p>
                La Corporación Municipal de Desarrollo Social de Calama (COMDES) es una entidad 
                de derecho privado que se encarga de la administración de salud en la comuna, por lo que 
                cuenta con cerca de 132 mil usuarios.
              </p>
              <p>
                COMDES fue fundada el 1 de septiembre de 1981, bajo el decreto N°13.063 del Ministerio 
                del Interior para recibir la administración de los establecimientos educacionales y 
                asumir el desafío de mejorar la calidad de vida de los habitantes de la comuna y sus 
                prestaciones de salud.
              </p>
              <p>
                Durante 43 años, la educación en nuestra comuna estuvo bajo la gestión directa de COMDES, 
                un periodo en el que se lograron importantes avances y también se enfrentaron desafíos. 
                Sin embargo, el 1 de enero de 2025, este proceso dio un giro con el traspaso de la 
                administración educativa al Servicio Local de Educación Pública (SLEP) Licancabur, 
                conforme al Decreto N°162. Este cambio marca un hito significativo, pues busca fortalecer 
                la calidad educativa y mejorar la gestión en los establecimientos escolares, garantizando 
                una mayor equidad e inclusión.
              </p>
              <p>
                Actualmente la corporación es liderada por el señor Luis Patricio Villaseca Soto como 
                director ejecutivo, y bajo su dirección le acompañan las unidades de: Control Interno, 
                Jurídico, Dirección de salud, Administración, Finanzas, y RR.HH.
              </p>
              <p>
                De esta forma, la corporación logró ser una de las empresas con mayor estabilidad laboral 
                en la zona y su dotación es superior a las 990 personas entre profesionales del área de 
                la atención primaria de salud.
              </p>
              <p>
                COMDES apuesta por seguir asegurando un servicio de salud familiar con altos estándares de 
                calidad, orientado a generar atenciones significativas en un ambiente de equidad, 
                participación y sana convivencia, para entregar a la comunidad de Calama los mejores 
                servicios salud. COMDES se compromete con el desarrollo del país, de la región y 
                especialmente de la comuna de Calama.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mission-vision">
        <div className="container">
          <div className="mission-vision-content">
            <div className="mission-box">
              <h3>Nuestra Misión</h3>
              <p>
                Promover, garantizar y administrar para nuestra comunidad, los servicios de salud a 
                través de una gestión innovadora, eficiente e inclusiva.
              </p>
            </div>
            <div className="vision-box">
              <h3>Nuestra Visión</h3>
              <p>
                Ser una corporación líder en la administración de recursos municipales.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="values-section">
        <div className="container">
          <h2 className="values-title">Nuestros Valores</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">👥</div>
              <h3>Compromiso Social</h3>
              <p>Trabajamos con y para las personas, priorizando siempre el bien común y el desarrollo integral de nuestra comunidad.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🔍</div>
              <h3>Transparencia</h3>
              <p>Promovemos una gestión abierta y honesta, garantizando el acceso a la información y la rendición de cuentas.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🤝</div>
              <h3>Equidad</h3>
              <p>Buscamos reducir las brechas sociales y garantizar el acceso igualitario a oportunidades y servicios.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">💡</div>
              <h3>Innovación</h3>
              <p>Nos adaptamos constantemente a los cambios y buscamos soluciones creativas a los desafíos sociales.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🌎</div>
              <h3>Respeto a la Diversidad</h3>
              <p>Valoramos y celebramos la diversidad cultural, étnica y social de nuestra comunidad.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">✅</div>
              <h3>Excelencia</h3>
              <p>Nos esforzamos por ofrecer servicios de alta calidad que respondan efectivamente a las necesidades de los ciudadanos.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="organigram-section">
        <div className="container">

          <div className="organigram-content">

            <div className="organigram-text">
              <h2>Nuestro Organigrama</h2>
            </div>

            <div className="organigram-image">
              <img src="/assets/images/about/organigrama_2025.jpg" alt="Organigrama COMDES Calama" />
            </div>

          </div>

        </div>
      </section>

      <section className="team-section">
        <div className="container">
          <h2 className="team-title">Nuestro Equipo Directivo</h2>
          <div className="team-grid">
            <div className="team-member">
              <div className="member-image">
                <img src="/assets/images/about/luis_villaseca.jpeg" alt="Director Ejecutivo" />
              </div>
              <h3 className="member-name">Luis Patricio Villaseca Soto</h3>
              <p className="member-position">Director Ejecutivo</p>
            </div>
            <div className="team-member">
              <div className="member-image">
                <img src="/assets/images/about/pia_cortes.jpeg" alt="Directora de Salud" />
              </div>
              <h3 className="member-name">Pia Cortes Maldonado</h3>
              <p className="member-position">Directora de Salud</p>
            </div>
            <div className="team-member">
              <div className="member-image">
                <img src="/assets/images/about/marianela_lopez.jpeg" alt="Director de Administración" />
              </div>
              <h3 className="member-name">Marianela Lopez Menay</h3>
              <p className="member-position">Jefa de Administración</p>
            </div>
            <div className="team-member">
              <div className="member-image">
                <img src="/assets/images/about/janet_sorensen.jpeg" alt="Directora de Finanzas" />
              </div>
              <h3 className="member-name">Janet Sorensen Andueza</h3>
              <p className="member-position">jefa de Finanzas</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;