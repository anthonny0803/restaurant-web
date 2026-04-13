import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-800 to-stone-900" />

      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative max-w-2xl px-6 text-center animate-fade-in-up">
        <div className="mx-auto h-px w-16 bg-amber-500" />

        <p className="mt-6 text-xs font-medium tracking-[0.4em] text-amber-500 uppercase">
          Experiencia gastronomica
        </p>

        <h1 className="mt-6 font-serif text-5xl font-medium leading-tight text-white sm:text-6xl">
          Donde cada detalle importa
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-zinc-400">
          Reserva tu mesa, explora nuestro menu y disfruta de una velada
          inolvidable en un ambiente pensado para ti.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            to="/reservations/new"
            className="rounded-sm bg-amber-500 px-8 py-3 text-sm font-medium tracking-wide text-zinc-900
              transition-colors duration-200 hover:bg-amber-400"
          >
            Reservar mesa
          </Link>
          <Link
            to="/menu"
            className="rounded-sm border border-zinc-600 px-8 py-3 text-sm font-medium tracking-wide
              text-zinc-300 transition-colors duration-200 hover:border-white hover:text-white"
          >
            Ver menu
          </Link>
        </div>

        <div className="mx-auto mt-10 h-px w-16 bg-amber-500" />
      </div>
    </div>
  );
}
