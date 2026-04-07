import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ForgotPasswordPage from "../ForgotPasswordPage";
import * as authService from "../../services/auth.service";
import { ApiValidationError } from "../../lib/api";

vi.mock("../../services/auth.service");

function renderForgotPasswordPage() {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );
}

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email field and submit button", () => {
    renderForgotPasswordPage();

    expect(screen.getByLabelText("Correo electronico")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Enviar enlace de recuperacion" }),
    ).toBeInTheDocument();
  });

  it("shows success message after successful submit", async () => {
    vi.mocked(authService.forgotPassword).mockResolvedValue({
      message: "Te enviamos un enlace de recuperacion",
    });
    renderForgotPasswordPage();
    const user = userEvent.setup();

    await user.type(
      screen.getByLabelText("Correo electronico"),
      "test@email.com",
    );
    await user.click(
      screen.getByRole("button", { name: "Enviar enlace de recuperacion" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Te enviamos un enlace de recuperacion"),
      ).toBeInTheDocument();
    });
    expect(authService.forgotPassword).toHaveBeenCalledWith("test@email.com");
  });

  it("hides form and shows login link after success", async () => {
    vi.mocked(authService.forgotPassword).mockResolvedValue({
      message: "Enlace enviado",
    });
    renderForgotPasswordPage();
    const user = userEvent.setup();

    await user.type(
      screen.getByLabelText("Correo electronico"),
      "test@email.com",
    );
    await user.click(
      screen.getByRole("button", { name: "Enviar enlace de recuperacion" }),
    );

    await waitFor(() => {
      expect(screen.getByText("Enlace enviado")).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: "Enviar enlace de recuperacion" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Volver a iniciar sesion")).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("displays field errors on 422 validation error", async () => {
    vi.mocked(authService.forgotPassword).mockRejectedValue(
      new ApiValidationError({
        message: "Validation failed",
        errors: { email: ["El correo no esta registrado"] },
      }),
    );
    renderForgotPasswordPage();
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: "Enviar enlace de recuperacion" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("El correo no esta registrado"),
      ).toBeInTheDocument();
    });
  });

  it("displays general error for non-validation errors", async () => {
    vi.mocked(authService.forgotPassword).mockRejectedValue(
      new Error("Error del servidor"),
    );
    renderForgotPasswordPage();
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: "Enviar enlace de recuperacion" }),
    );

    await waitFor(() => {
      expect(screen.getByText("Error del servidor")).toBeInTheDocument();
    });
  });
});
