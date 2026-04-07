import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ResetPasswordPage from "../ResetPasswordPage";
import * as authService from "../../services/auth.service";
import { ApiValidationError } from "../../lib/api";

vi.mock("../../services/auth.service");

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderResetPasswordPage(
  searchParams = "?token=abc123&email=test@email.com",
) {
  return render(
    <MemoryRouter initialEntries={[`/reset-password${searchParams}`]}>
      <ResetPasswordPage />
    </MemoryRouter>,
  );
}

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders password fields and submit button", () => {
    renderResetPasswordPage();

    expect(screen.getByLabelText("Nueva contrasena")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar contrasena")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Restablecer contrasena" }),
    ).toBeInTheDocument();
  });

  it("calls resetPassword with token/email from URL and navigates to /login", async () => {
    vi.mocked(authService.resetPassword).mockResolvedValue({
      message: "Contrasena actualizada",
    });
    renderResetPasswordPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Nueva contrasena"), "newpass123");
    await user.type(
      screen.getByLabelText("Confirmar contrasena"),
      "newpass123",
    );
    await user.click(
      screen.getByRole("button", { name: "Restablecer contrasena" }),
    );

    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith({
        token: "abc123",
        email: "test@email.com",
        password: "newpass123",
        password_confirmation: "newpass123",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("displays field errors on 422 validation error", async () => {
    vi.mocked(authService.resetPassword).mockRejectedValue(
      new ApiValidationError({
        message: "Validation failed",
        errors: { password: ["La contrasena debe tener al menos 8 caracteres"] },
      }),
    );
    renderResetPasswordPage();
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: "Restablecer contrasena" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("La contrasena debe tener al menos 8 caracteres"),
      ).toBeInTheDocument();
    });
  });

  it("shows error message when token or email are missing from URL", () => {
    renderResetPasswordPage("");

    expect(
      screen.getByText(
        "El enlace de recuperacion es invalido o ha expirado.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Solicitar un nuevo enlace")).toHaveAttribute(
      "href",
      "/forgot-password",
    );
    expect(
      screen.queryByRole("button", { name: "Restablecer contrasena" }),
    ).not.toBeInTheDocument();
  });

  it("displays general error for non-validation errors", async () => {
    vi.mocked(authService.resetPassword).mockRejectedValue(
      new Error("Token invalido"),
    );
    renderResetPasswordPage();
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: "Restablecer contrasena" }),
    );

    await waitFor(() => {
      expect(screen.getByText("Token invalido")).toBeInTheDocument();
    });
  });
});
