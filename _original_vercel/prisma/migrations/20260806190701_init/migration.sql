-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'SENIA_PAGADA', 'RECHAZADA', 'CANCELADA_SIN_SENIA');

-- CreateEnum
CREATE TYPE "Planta" AS ENUM ('BAJA', 'ALTA');

-- CreateTable
CREATE TABLE "Departamento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "capacidad" INTEGER NOT NULL DEFAULT 5,
    "planta" "Planta" NOT NULL,
    "colorCalendario" TEXT NOT NULL,

    CONSTRAINT "Departamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL,
    "nombreSolicitante" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "cantPersonas" INTEGER NOT NULL,
    "puedeSubirEscaleras" BOOLEAN NOT NULL DEFAULT true,
    "precioTotal" DECIMAL(65,30) NOT NULL,
    "montoSenia" DECIMAL(65,30),
    "seniaPagada" BOOLEAN NOT NULL DEFAULT false,
    "vencimientoSenia" TIMESTAMP(3),
    "aceptoReglas" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'PENDIENTE',
    "departamentoId" TEXT,
    "viajanteFrecuenteId" TEXT,
    "googleEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonaHuesped" (
    "id" TEXT NOT NULL,
    "reservaId" TEXT NOT NULL,
    "nombre" TEXT,
    "numeroDni" TEXT,
    "fotoDniFrente" TEXT,
    "fotoDniDorso" TEXT,

    CONSTRAINT "PersonaHuesped_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ViajanteFrecuente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "cantPersonasHabitual" INTEGER NOT NULL,
    "claveIngresoFija" TEXT,
    "notas" TEXT,

    CONSTRAINT "ViajanteFrecuente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TarifaMatriz" (
    "id" TEXT NOT NULL,
    "cantPersonas" INTEGER NOT NULL,
    "cantNoches" INTEGER NOT NULL,
    "precioTotal" DECIMAL(65,30) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TarifaMatriz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListaNegra" (
    "id" TEXT NOT NULL,
    "numeroDni" TEXT NOT NULL,
    "nombre" TEXT,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListaNegra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionGeneral" (
    "id" TEXT NOT NULL,
    "porcentajeSenia" DECIMAL(65,30) NOT NULL DEFAULT 30,
    "plazoVencimientoHoras" INTEGER NOT NULL DEFAULT 24,
    "textoReglas" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionGeneral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reserva_departamentoId_idx" ON "Reserva"("departamentoId");

-- CreateIndex
CREATE INDEX "Reserva_estado_idx" ON "Reserva"("estado");

-- CreateIndex
CREATE INDEX "PersonaHuesped_reservaId_idx" ON "PersonaHuesped"("reservaId");

-- CreateIndex
CREATE UNIQUE INDEX "TarifaMatriz_cantPersonas_cantNoches_key" ON "TarifaMatriz"("cantPersonas", "cantNoches");

-- CreateIndex
CREATE UNIQUE INDEX "ListaNegra_numeroDni_key" ON "ListaNegra"("numeroDni");

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_viajanteFrecuenteId_fkey" FOREIGN KEY ("viajanteFrecuenteId") REFERENCES "ViajanteFrecuente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonaHuesped" ADD CONSTRAINT "PersonaHuesped_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "Reserva"("id") ON DELETE CASCADE ON UPDATE CASCADE;
