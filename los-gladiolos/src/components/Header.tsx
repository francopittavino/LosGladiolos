'use client'

import Link from 'next/link'

export default function Header() {
  return (
    <header className="header">
      <Link href="/" className="logo">
        <span>Los Gladiolos</span>
        <span className="logo-badge">Alojamiento</span>
      </Link>

      <nav>
        <ul className="nav-links">
          <li>
            <a href="#galeria" className="nav-link">
              El Complejo
            </a>
          </li>
          <li>
            <a href="#reservar" className="nav-link">
              Reservas
            </a>
          </li>
          <li>
            <a href="#reservar" className="nav-link" onClick={() => {
              // Si hace clic en viajantes, scrollea y activa la pestaña de viajantes
              const tabBtn = document.getElementById('tab-viajante')
              if (tabBtn) tabBtn.click()
            }}>
              ⭐ Viajantes Frecuentes
            </a>
          </li>
          <li>
            <Link href="/admin" className="nav-btn-secondary">
              🔒 Panel Admin
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}
