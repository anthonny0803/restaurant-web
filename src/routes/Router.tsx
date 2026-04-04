import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import Layout from "../components/Layout";
import ProtectedRoute from "./ProtectedRoute";

// Placeholder components until real pages are built
function Placeholder({ name }: { name: string }) {
  return <h1>{name}</h1>;
}

export default function Router() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            {/* Public routes */}
            <Route path="/" element={<Placeholder name="Home" />} />
            <Route path="/login" element={<Placeholder name="Login" />} />
            <Route
              path="/register"
              element={<Placeholder name="Register" />}
            />
            <Route
              path="/forgot-password"
              element={<Placeholder name="Forgot Password" />}
            />
            <Route
              path="/reset-password"
              element={<Placeholder name="Reset Password" />}
            />
            <Route path="/menu" element={<Placeholder name="Menu" />} />
            <Route
              path="/reservations/new"
              element={<Placeholder name="New Reservation" />}
            />
            <Route
              path="/payment"
              element={<Placeholder name="Payment" />}
            />
            <Route
              path="/complete-account"
              element={<Placeholder name="Complete Account" />}
            />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route
                path="/my-reservations"
                element={<Placeholder name="My Reservations" />}
              />
              <Route
                path="/my-reservations/:id/pre-order"
                element={<Placeholder name="Pre-order" />}
              />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
