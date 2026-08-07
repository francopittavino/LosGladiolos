import { PrismaClient, Planta } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Cargando departamentos iniciales...')

  const departamentos = [
    {
      nombre: 'Departamento 1',
      capacidad: 4,
      planta: Planta.BAJA,
      colorCalendario: '#1E88E5', // Azul
    },
    {
      nombre: 'Departamento 2',
      capacidad: 4,
      planta: Planta.BAJA,
      colorCalendario: '#43A047', // Verde
    },
    {
      nombre: 'Departamento 3',
      capacidad: 4,
      planta: Planta.ALTA,
      colorCalendario: '#FB8C00', // Naranja
    },
    {
      nombre: 'Departamento 4',
      capacidad: 4,
      planta: Planta.ALTA,
      colorCalendario: '#8E24AA', // Púrpura
    },
  ]

  for (const depto of departamentos) {
    const creado = await prisma.departamento.upsert({
      where: { id: `depto-${depto.nombre.toLowerCase().replace(' ', '-')}` },
      update: depto,
      create: {
        id: `depto-${depto.nombre.toLowerCase().replace(' ', '-')}`,
        ...depto,
      },
    })
    console.log(`✅ Creado: ${creado.nombre} (${creado.planta})`)
  }

  console.log('¡Departamentos cargados con éxito!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
