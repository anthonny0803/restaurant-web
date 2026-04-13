import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ToastContainer from "./ToastContainer";

const NAV_LINK_BASE =
  "relative py-1 text-sm tracking-wide transition-colors duration-200 text-zinc-400 hover:text-white";
const NAV_LINK_ACTIVE =
  "text-white after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-amber-500";

const SIDEBAR_LINK_BASE =
  "text-lg font-light tracking-wide transition-colors duration-200";
const SIDEBAR_LINK_INACTIVE = "text-zinc-400 hover:text-white";
const SIDEBAR_LINK_ACTIVE = "text-white border-l-2 border-amber-500 pl-4";

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isUserMenuOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isUserMenuOpen]);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
  };

  const closeMenu = () => setIsMenuOpen(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `${NAV_LINK_BASE} ${isActive ? NAV_LINK_ACTIVE : ""}`;

  const sidebarLinkClass = ({ isActive }: { isActive: boolean }) =>
    `${SIDEBAR_LINK_BASE} ${isActive ? SIDEBAR_LINK_ACTIVE : SIDEBAR_LINK_INACTIVE}`;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-zinc-900 via-zinc-800 to-stone-900">
      <header className="sticky top-0 z-40 bg-zinc-900/95 shadow-lg backdrop-blur-sm">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="text-xl font-light tracking-widest text-white uppercase"
          >
            Restaurant
          </Link>

          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="cursor-pointer text-zinc-300 hover:text-white md:hidden"
            aria-label="Abrir menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="hidden items-center gap-8 md:flex">
            <NavLink to="/" end className={navLinkClass}>
              Inicio
            </NavLink>
            <NavLink to="/menu" className={navLinkClass}>
              Menu
            </NavLink>
            <NavLink to="/reservations/new" className={navLinkClass}>
              Reservar
            </NavLink>

            {isAuthenticated ? (
              <>
                <NavLink to="/my-reservations" className={navLinkClass}>
                  Mis Reservaciones
                </NavLink>

                <div ref={userMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex cursor-pointer items-center gap-1.5 text-sm text-zinc-400 transition-colors duration-200 hover:text-white"
                  >
                    {user?.name}
                    <svg
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-3 w-48 rounded-sm border border-zinc-700 bg-zinc-800 py-1 shadow-lg">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full cursor-pointer px-4 py-2.5 text-left text-sm text-zinc-400 transition-colors duration-200 hover:bg-zinc-700 hover:text-white"
                      >
                        Desconectarse
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass}>
                  Iniciar sesion
                </NavLink>
                <NavLink
                  to="/register"
                  className="rounded-sm border border-amber-500 px-4 py-1.5 text-sm text-amber-500 transition-colors duration-200 hover:bg-amber-500 hover:text-zinc-900"
                >
                  Registrarse
                </NavLink>
              </>
            )}
          </div>
        </nav>
      </header>

      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 md:hidden ${
          isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-black/60" onClick={closeMenu} />

        <aside
          className={`absolute inset-0 flex flex-col bg-zinc-900 transition-transform duration-300 ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-8 py-6">
            <span className="text-sm font-light tracking-widest text-zinc-500 uppercase">
              Menu
            </span>
            <button
              type="button"
              onClick={closeMenu}
              className="cursor-pointer text-zinc-400 hover:text-white"
              aria-label="Cerrar menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-7 px-8 pt-6">
            <NavLink to="/" end className={sidebarLinkClass} onClick={closeMenu}>
              Inicio
            </NavLink>
            <NavLink to="/menu" className={sidebarLinkClass} onClick={closeMenu}>
              Menu
            </NavLink>
            <NavLink to="/reservations/new" className={sidebarLinkClass} onClick={closeMenu}>
              Reservar
            </NavLink>

            {isAuthenticated ? (
              <>
                <NavLink to="/my-reservations" className={sidebarLinkClass} onClick={closeMenu}>
                  Mis Reservaciones
                </NavLink>

                <div className="mt-auto border-t border-zinc-800 pt-6 pb-10">
                  <p className="text-sm font-medium text-zinc-400">{user?.name}</p>
                  <button
                    type="button"
                    onClick={() => { handleLogout(); closeMenu(); }}
                    className="mt-4 cursor-pointer text-sm text-zinc-500 transition-colors duration-200 hover:text-white"
                  >
                    Desconectarse
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-auto border-t border-zinc-800 pt-6 pb-10">
                <NavLink to="/login" className={sidebarLinkClass} onClick={closeMenu}>
                  Iniciar sesion
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={closeMenu}
                  className="mt-6 block rounded-sm border border-amber-500 px-4 py-2.5 text-center text-sm text-amber-500 transition-colors duration-200 hover:bg-amber-500 hover:text-zinc-900"
                >
                  Registrarse
                </NavLink>
              </div>
            )}
          </div>
        </aside>
      </div>

      <main className="flex-1">
        <Outlet />
      </main>

      <ToastContainer />

      <footer className="bg-zinc-950 px-6 pt-14 pb-8">
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-3">
          <div>
            <p className="text-sm font-light tracking-widest text-white uppercase">
              Restaurant
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Una experiencia gastronomica donde cada detalle esta pensado para ti.
            </p>
          </div>

          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-zinc-400 uppercase">
              Navegacion
            </p>
            <nav className="mt-3 flex flex-col gap-2">
              <Link to="/menu" className="text-sm text-zinc-500 transition-colors duration-200 hover:text-white">
                Menu
              </Link>
              <Link to="/reservations/new" className="text-sm text-zinc-500 transition-colors duration-200 hover:text-white">
                Reservar mesa
              </Link>
              {isAuthenticated && (
                <Link to="/my-reservations" className="text-sm text-zinc-500 transition-colors duration-200 hover:text-white">
                  Mis reservaciones
                </Link>
              )}
            </nav>
          </div>

          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-zinc-400 uppercase">
              Horario
            </p>
            <div className="mt-3 space-y-1 text-sm text-zinc-500">
              <p>Lunes a Viernes: 13:00 - 23:00</p>
              <p>Sabados y Domingos: 12:00 - 23:30</p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-6xl border-t border-zinc-800 pt-6 text-center">
          <p className="text-xs tracking-wide text-zinc-600">
            Restaurant. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
