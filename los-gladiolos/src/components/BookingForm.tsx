'use client'

import { useState, useEffect } from 'react'

export default function BookingForm() {
  const [activeTab, setActiveTab] = useState<'general' | 'viajante'>('general')

  // Formulario General
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [cantPersonas, setCantPersonas] = useState(1)
  const [puedeSubirEscaleras, setPuedeSubirEscaleras] = useState(true)
  const [aceptoReglas, setAceptoReglas] = useState(false)

  // Lista de huéspedes (DNI + fotos)
  const [huespedes, setHuespedes] = useState<
    Array<{ nombre: string; numeroDni: string; frente: File | null; dorso: File | null }>
  >([{ nombre: '', numeroDni: '', frente: null, dorso: null }])

  // Formulario Viajante Frecuente
  const [dniViajante, setDniViajante] = useState('')
  const [claveViajante, setClaveViajante] = useState('')
  const [fechaInicioViajante, setFechaInicioViajante] = useState('')
  const [fechaFinViajante, setFechaFinViajante] = useState('')
  const [viajanteValidado, setViajanteValidado] = useState<any>(null)

  // Precio y Estados de Envío
  const [precioTotal, setPrecioTotal] = useState<number | null>(null)
  const [cargando, setCargando] = useState(false)
  const [mensajeResultado, setMensajeResultado] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  // Ajustar cantidad de campos de huésped al cambiar la cantidad de personas
  useEffect(() => {
    setHuespedes((prev) => {
      const actual = [...prev]
      if (actual.length < cantPersonas) {
        for (let i = actual.length; i < cantPersonas; i++) {
          actual.push({ nombre: '', numeroDni: '', frente: null, dorso: null })
        }
      } else if (actual.length > cantPersonas) {
        actual.splice(cantPersonas)
      }
      return actual
    })
  }, [cantPersonas])

  // Calcular Noches y Precio Total cuando cambian las fechas o personas
  useEffect(() => {
    if (fechaInicio && fechaFin && cantPersonas > 0) {
      const inicio = new Date(fechaInicio)
      const fin = new Date(fechaFin)
      const diffTime = fin.getTime() - inicio.getTime()
      const noches = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (noches > 0) {
        // Consultar el precio calculado en el backend
        fetch(`/api/calcular-precio?personas=${cantPersonas}&noches=${noches}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.precioTotal) setPrecioTotal(data.precioTotal)
          })
          .catch(() => {
            // Precio estimado local fallback
            setPrecioTotal(cantPersonas * noches * 10000)
          })
      } else {
        setPrecioTotal(null)
      }
    } else {
      setPrecioTotal(null)
    }
  }, [fechaInicio, fechaFin, cantPersonas])

  // Enviar Reserva General
  const handleGeneralSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMensajeResultado(null)

    if (!aceptoReglas) {
      setMensajeResultado({ tipo: 'error', texto: 'Debes aceptar las reglas del alojamiento para continuar.' })
      return
    }

    // Validar que cada huésped tenga su número de DNI
    for (let i = 0; i < huespedes.length; i++) {
      if (!huespedes[i].numeroDni.trim()) {
        setMensajeResultado({
          tipo: 'error',
          texto: `Por favor ingresa el número de DNI de la persona #${i + 1}.`,
        })
        return
      }
    }

    setCargando(true)

    try {
      // Simulación de envío hasta integrar almacenamiento e API
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreSolicitante: nombre,
          telefono,
          fechaInicio,
          fechaFin,
          cantPersonas,
          puedeSubirEscaleras,
          dnis: huespedes.map((h) => h.numeroDni),
          precioTotal,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.exito) {
        setMensajeResultado({ tipo: 'error', texto: data.error || 'No hay disponibilidad para esas fechas.' })
      } else {
        setMensajeResultado({
          tipo: 'ok',
          texto: '¡Reserva enviada con éxito! Te notificaremos a la brevedad por WhatsApp.',
        })
      }
    } catch (err) {
      setMensajeResultado({
        tipo: 'error',
        texto: 'Ocurrió un error al enviar la solicitud. Por favor intenta de nuevo.',
      })
    } finally {
      setCargando(false)
    }
  }

  // Verificar DNI de Viajante Frecuente
  const handleVerificarViajante = async () => {
    if (!dniViajante.trim()) return
    setCargando(true)
    try {
      const res = await fetch(`/api/viajantes/verificar?dni=${dniViajante}`)
      const data = await res.json()
      if (data.encontrado) {
        setViajanteValidado(data.viajante)
        setMensajeResultado(null)
      } else {
        setMensajeResultado({
          tipo: 'error',
          texto: 'No encontramos ningún viajante frecuente registrado con ese DNI.',
        })
      }
    } catch (err) {
      setMensajeResultado({ tipo: 'error', texto: 'Error al verificar viajante frecuente.' })
    } finally {
      setCargando(false)
    }
  }

  return (
    <div id="reservar" className="booking-container">
      <div className="booking-card">
        {/* Pestañas / Tabs */}
        <div className="booking-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            🏠 Reserva General
          </button>
          <button
            id="tab-viajante"
            type="button"
            className={`tab-btn ${activeTab === 'viajante' ? 'active' : ''}`}
            onClick={() => setActiveTab('viajante')}
          >
            ⭐ Viajantes Frecuentes
          </button>
        </div>

        <div className="tab-content">
          {/* TAB 1: RESERVA GENERAL */}
          {activeTab === 'general' && (
            <form onSubmit={handleGeneralSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nombre Completo del Solicitante</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej: Juan Pérez"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Teléfono de Contacto (WhatsApp)</label>
                  <input
                    type="tel"
                    required
                    className="form-input"
                    placeholder="Ej: 11 1234 5678"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha de Ingreso (Check-in)</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha de Salida (Check-out)</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cantidad de Personas (Máx. 5)</label>
                  <select
                    className="form-select"
                    value={cantPersonas}
                    onChange={(e) => setCantPersonas(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'Persona' : 'Personas'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label className="checkbox-group">
                    <input
                      type="checkbox"
                      checked={!puedeSubirEscaleras}
                      onChange={(e) => setPuedeSubirEscaleras(!e.target.checked)}
                    />
                    <span className="checkbox-text">
                      ♿ <strong>Accesibilidad reducida:</strong> Alguna persona de la reserva NO puede subir escaleras (Asigna automáticamente Planta Baja).
                    </span>
                  </label>
                </div>
              </div>

              {/* Seccion DNI para cada huesped */}
              <div style={{ marginTop: '2rem' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
                  🪪 Datos e Identificación (DNI) de los Huéspedes
                </h4>

                {huespedes.map((h, index) => (
                  <div key={index} className="guest-dni-box">
                    <div className="guest-dni-header">
                      👤 Persona #{index + 1}
                    </div>

                    <div className="form-grid" style={{ marginBottom: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Nombre (Opcional)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Nombre y Apellido"
                          value={h.nombre}
                          onChange={(e) => {
                            const newH = [...huespedes]
                            newH[index].nombre = e.target.value
                            setHuespedes(newH)
                          }}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Número de DNI (Obligatorio)</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          placeholder="Ej: 38123456"
                          value={h.numeroDni}
                          onChange={(e) => {
                            const newH = [...huespedes]
                            newH[index].numeroDni = e.target.value
                            setHuespedes(newH)
                          }}
                        />
                      </div>
                    </div>

                    <div className="file-upload-grid">
                      <label className="file-upload-label">
                        <span>📷 Foto DNI Frente</span>
                        <div className="upload-text">
                          {h.frente ? h.frente.name : 'Haz clic para adjuntar foto'}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const newH = [...huespedes]
                            newH[index].frente = e.target.files?.[0] || null
                            setHuespedes(newH)
                          }}
                        />
                      </label>

                      <label className="file-upload-label">
                        <span>📷 Foto DNI Dorso</span>
                        <div className="upload-text">
                          {h.dorso ? h.dorso.name : 'Haz clic para adjuntar foto'}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const newH = [...huespedes]
                            newH[index].dorso = e.target.files?.[0] || null
                            setHuespedes(newH)
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Aceptación de reglas */}
              <div style={{ margin: '1.5rem 0' }}>
                <div
                  style={{
                    background: 'var(--bg-alt)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    marginBottom: '0.75rem',
                    maxHeight: '100px',
                    overflowY: 'auto',
                    border: '1px solid var(--border)',
                  }}
                >
                  <strong>Reglas del Alojamiento "Los Gladiolos":</strong>
                  <br />
                  - No se permiten fiestas ni ruidos molestos después de las 23:00 hs.
                  <br />
                  - Prohibido fumar dentro de los departamentos.
                  <br />
                  - Respetar el horario de check-in y check-out acordado.
                </div>

                <label className="checkbox-group">
                  <input
                    type="checkbox"
                    checked={aceptoReglas}
                    onChange={(e) => setAceptoReglas(e.target.checked)}
                  />
                  <span className="checkbox-text">
                    Acepto las reglas del alojamiento "Los Gladiolos".
                  </span>
                </label>
              </div>

              {/* Muestra de Precio Calculado */}
              {precioTotal !== null && (
                <div className="price-summary-box">
                  <div className="price-details">
                    <span className="price-label">Precio Total Calculado</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Para {cantPersonas} personas
                    </span>
                  </div>
                  <div className="price-amount">${precioTotal.toLocaleString('es-AR')}</div>
                </div>
              )}

              {mensajeResultado && (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1rem',
                    background: mensajeResultado.tipo === 'ok' ? '#e8f5e9' : '#ffebee',
                    color: mensajeResultado.tipo === 'ok' ? '#2e7d32' : '#c62828',
                    fontWeight: 500,
                  }}
                >
                  {mensajeResultado.texto}
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={cargando}>
                {cargando ? 'Procesando Reserva...' : 'Enviar Solicitud de Reserva'}
              </button>
            </form>
          )}

          {/* TAB 2: VIAJANTES FRECUENTES */}
          {activeTab === 'viajante' && (
            <div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Si ya sos cliente o viajante frecuente registrado, ingresá tu número de DNI para reservar directamente sin requerir seña ni carga de documentos.
              </p>

              {!viajanteValidado ? (
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Número de DNI Registrado</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ingresá tu DNI"
                      value={dniViajante}
                      onChange={(e) => setDniViajante(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="nav-btn"
                      style={{ width: '100%' }}
                      onClick={handleVerificarViajante}
                      disabled={cargando}
                    >
                      {cargando ? 'Verificando...' : 'Verificar Cliente Frecuente'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ background: 'var(--primary-light)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                  <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>
                    ¡Bienvenido/a, {viajanteValidado.nombre}! ⭐
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Tu acceso como viajante frecuente está verificado. Seleccioná las fechas de tu estadía para confirmar automáticamente tu departamento.
                  </p>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Fecha de Ingreso</label>
                      <input
                        type="date"
                        className="form-input"
                        value={fechaInicioViajante}
                        onChange={(e) => setFechaInicioViajante(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Fecha de Salida</label>
                      <input
                        type="date"
                        className="form-input"
                        value={fechaFinViajante}
                        onChange={(e) => setFechaFinViajante(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="button" className="submit-btn" style={{ marginTop: '1rem' }}>
                    Confirmar Reserva Directa (Sin Seña)
                  </button>
                </div>
              )}

              {mensajeResultado && (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    marginTop: '1rem',
                    background: mensajeResultado.tipo === 'ok' ? '#e8f5e9' : '#ffebee',
                    color: mensajeResultado.tipo === 'ok' ? '#2e7d32' : '#c62828',
                    fontWeight: 500,
                  }}
                >
                  {mensajeResultado.texto}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
