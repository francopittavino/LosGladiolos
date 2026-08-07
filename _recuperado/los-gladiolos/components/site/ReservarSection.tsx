import { ReservaForm } from "@/components/reserva/ReservaForm";

export function ReservarSection() {
  return (
    <section className="px-6 py-10 sm:py-14">
      <h2 className="mb-8 text-center text-2xl font-bold text-carbon">Reservá tu estadía</h2>
      <ReservaForm />
    </section>
  );
}
