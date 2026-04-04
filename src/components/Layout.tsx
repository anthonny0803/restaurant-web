import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div>
      <header>
        <nav>
          <Link to="/">Inicio</Link>
          <Link to="/menu">Menu</Link>
          <Link to="/reservations/new">Reservar</Link>

          {isAuthenticated ? (
            <>
              <Link to="/my-reservations">Mis Reservaciones</Link>
              <span>{user?.name}</span>
              <button type="button" onClick={handleLogout}>
                Cerrar sesion
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Iniciar sesion</Link>
              <Link to="/register">Registrarse</Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer>
        <p>Restaurant App</p>
      </footer>
    </div>
  );
}
