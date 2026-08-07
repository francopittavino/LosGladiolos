import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Planta } from '@prisma/client'

export async function GET() {
  try {
    const departamentos = [
      {
        id: 'depto-1',
        nombre: 'Departamento 1',
        capacidad: 5,
        planta: Planta.BAJA,
        colorCalendario: '#1E88E5', // Azul
      },
      {
        id: 'depto-2',
        nombre: 'Departamento 2',
        capacidad: 5,
        planta: Planta.BAJA,
        colorCalendario: '#43A047', // Verde
      },
      {
        id: 'depto-3',
        nombre: 'Departamento 3',
        capacidad: 5,
        planta: Planta.ALTA,
        colorCalendario: '#FB8C00', // Naranja
      },
      {
        id: 'depto-4',
        nombre: 'Departamento 4',
        capacidad: 5,
        planta: Planta.ALTA,
        colorCalendario: '#8E24AA', // Púrpura
      },
    ]

    const resultados = []
    for (const depto of departamentos) {
      const d = await db.departamento.upsert({
        where: { id: depto.id },
        update: depto,
        create: depto,
      })
      resultados.push(d)
    }

    return NextResponse.json({
      exito: true,
      mensaje: 'Departamentos cargados correctamente (capacidad 5 personas)',
      departamentos: resultados,
    })
  } catch (error: any) {
    return NextResponse.json(
      { exito: false, error: error.message },
      { status: 500 }
    )
  }
}
