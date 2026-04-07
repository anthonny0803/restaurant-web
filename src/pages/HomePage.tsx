import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Bienvenido a nuestro restaurante
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Reserva tu mesa, explora nuestro menu y disfruta de una experiencia
          gastronomica unica.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            to="/reservations/new"
            className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-medium text-white
              transition-colors hover:bg-indigo-700"
          >
            Reservar mesa
          </Link>
          <Link
            to="/menu"
            className="rounded-md border border-gray-300 bg-white px-6 py-3 text-sm
              font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Ver menu
          </Link>
        </div>
      </div>
    </div>
  );
}
