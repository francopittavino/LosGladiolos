import { db } from '@/lib/db'

/**
 * Verifica si alguno de los números de DNI proporcionados está en la Lista Negra.
 * Si encuentra uno bloqueado, retorna sus datos. De lo contrario retorna null.
 */
export async function verificarListaNegra(numerosDni: string[]) {
  // Limpiar caracteres no numéricos (puntos, espacios)
  const dnisLimpios = numerosDni
    .map((d) => d.trim().replace(/\D/g, ''))
    .filter(Boolean)

  if (dnisLimpios.length === 0) return null

  try {
    const bloqueado = await db.listaNegra.findFirst({
      where: {
        numeroDni: {
          in: dnisLimpios,
        },
      },
    })

    return bloqueado
  } catch (error) {
    console.error('Error al verificar lista negra:', error)
    return null
  }
}
