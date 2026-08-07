import { db } from '@/lib/db'

/**
 * Calcula el precio total buscando en la tabla de tarifas configurada por el admin (cantPersonas x cantNoches).
 * Si no hay una tarifa configurada en la matriz para esa combinación, usa un cálculo base estimado.
 */
export async function calcularPrecioTotal(
  cantPersonas: number,
  cantNoches: number
): Promise<number> {
  if (cantPersonas <= 0 || cantNoches <= 0) return 0

  try {
    const tarifaExacta = await db.tarifaMatriz.findUnique({
      where: {
        cantPersonas_cantNoches: {
          cantPersonas,
          cantNoches,
        },
      },
    })

    if (tarifaExacta) {
      return Number(tarifaExacta.precioTotal)
    }
  } catch (error) {
    console.error('Error al consultar tabla de tarifas:', error)
  }

  // Fallback si no hay tarifa cargada en la matriz: $10.000 por persona por noche
  const PRECIO_BASE_PERSONA_NOCHE = 10000
  return cantPersonas * cantNoches * PRECIO_BASE_PERSONA_NOCHE
}
