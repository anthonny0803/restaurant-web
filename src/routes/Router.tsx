import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import Layout from "../components/Layout";
import GuestRoute from "./GuestRoute";
import ProtectedRoute from "./ProtectedRoute";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import MenuPage from "../pages/MenuPage";
import NewReservationPage from "../pages/NewReservationPage";
import PaymentPage from "../pages/PaymentPage";
import MyReservationsPage from "../pages/MyReservationsPage";
import PreOrderPage from "../pages/PreOrderPage";
import CompleteAccountPage from "../pages/CompleteAccountPage";

export default function Router() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
        <Routes>
          <Route element={<Layout />}>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/forgot-password"
                element={<ForgotPasswordPage />}
              />
              <Route
                path="/reset-password"
                element={<ResetPasswordPage />}
              />
            </Route>
            <Route path="/menu" element={<MenuPage />} />
            <Route
              path="/reservations/new"
              element={<NewReservationPage />}
            />
            <Route path="/payment" element={<PaymentPage />} />
            <Route
              path="/complete-account"
              element={<CompleteAccountPage />}
            />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route
                path="/my-reservations"
                element={<MyReservationsPage />}
              />
              <Route
                path="/my-reservations/:id/pre-order"
                element={<PreOrderPage />}
              />
            </Route>
          </Route>
        </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
