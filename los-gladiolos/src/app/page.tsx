import Header from '@/components/Header'
import BookingForm from '@/components/BookingForm'

export default function Home() {
  return (
    <main>
      <Header />

      {/* Hero Section */}
      <section className="hero">
        <span className="hero-tag">🌿 Alojamiento por Día</span>
        <h1 className="hero-title">
          Bienvenidos a <span>Los Gladiolos</span>
        </h1>
        <p className="hero-subtitle">
          Disfrutá de una estadía cómoda y tranquila en nuestros 4 departamentos totalmente equipados.
          Contamos con unidades en Planta Baja y Planta Alta.
        </p>

        <div className="hero-badges">
          <div className="badge-item">🏢 4 Departamentos Equipados</div>
          <div className="badge-item">👥 Hasta 5 Personas por Depto</div>
          <div className="badge-item">♿ Opciones para Planta Baja</div>
          <div className="badge-item">⚡ Reserva Online Inmediata</div>
        </div>
      </section>

      {/* Galería de Fotos */}
      <section id="galeria" className="gallery-section">
        <div className="section-header">
          <h2 className="section-title">Nuestras Instalaciones</h2>
          <p className="section-subtitle">Conocé el complejo y la comodidad de nuestros departamentos</p>
        </div>

        <div className="gallery-grid">
          <div className="gallery-card">
            <div className="gallery-img-wrapper">
              <span style={{ fontSize: '3rem' }}>🏡</span>
            </div>
            <div className="gallery-info">
              <h3 className="gallery-card-title">Planta Baja — Depto 1 & 2</h3>
              <p className="gallery-card-desc">
                Ideal para quienes prefieren fácil acceso sin escaleras. Capacidad hasta 5 personas.
              </p>
            </div>
          </div>

          <div className="gallery-card">
            <div className="gallery-img-wrapper">
              <span style={{ fontSize: '3rem' }}>🌅</span>
            </div>
            <div className="gallery-info">
              <h3 className="gallery-card-title">Planta Alta — Depto 3 & 4</h3>
              <p className="gallery-card-desc">
                Con excelente vista y luminosidad natural. Capacidad hasta 5 personas.
              </p>
            </div>
          </div>

          <div className="gallery-card">
            <div className="gallery-img-wrapper">
              <span style={{ fontSize: '3rem' }}>🛋️</span>
            </div>
            <div className="gallery-info">
              <h3 className="gallery-card-title">Comodidad & Confort</h3>
              <p className="gallery-card-desc">
                Ambientes acondicionados, cocina equipada, Wi-Fi y estacionamiento.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Formulario de Reserva */}
      <BookingForm />

      {/* Footer */}
      <footer className="footer">
        <div className="footer-links">
          <a href="#galeria" className="footer-link">El Complejo</a>
          <a href="#reservar" className="footer-link">Reservas</a>
          <a href="/admin" className="footer-link">Panel Admin</a>
        </div>
        <p>© 2026 Los Gladiolos — Alojamiento por Día. Todos los derechos reservados.</p>
      </footer>
    </main>
  )
}
