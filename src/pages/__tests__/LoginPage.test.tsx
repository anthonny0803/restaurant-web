import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "../LoginPage";
import { ApiValidationError } from "../../lib/api";

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    login: mockLogin,
    register: vi.fn(),
    logout: vi.fn(),
    setSession: vi.fn(),
  }),
}));

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email and password fields with submit button", () => {
    renderLoginPage();

    expect(screen.getByLabelText("Correo electronico")).toBeInTheDocument();
    expect(screen.getByLabelText("Contrasena")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ingresar" }),
    ).toBeInTheDocument();
  });

  it("calls login and navigates to / on successful submit", async () => {
    mockLogin.mockResolvedValue(undefined);
    renderLoginPage();
    const user = userEvent.setup();

    await user.type(
      screen.getByLabelText("Correo electronico"),
      "test@email.com",
    );
    await user.type(screen.getByLabelText("Contrasena"), "password123");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@email.com", "password123");
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("displays field errors on 422 validation error", async () => {
    mockLogin.mockRejectedValue(
      new ApiValidationError({
        message: "Validation failed",
        errors: { email: ["El correo es obligatorio"] },
      }),
    );
    renderLoginPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    await waitFor(() => {
      expect(screen.getByText("El correo es obligatorio")).toBeInTheDocument();
    });
  });

  it("displays general error for non-validation errors", async () => {
    mockLogin.mockRejectedValue(new Error("Error del servidor"));
    renderLoginPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    await waitFor(() => {
      expect(screen.getByText("Error del servidor")).toBeInTheDocument();
    });
  });

  it("renders links to forgot password and register", () => {
    renderLoginPage();

    expect(screen.getByText("Olvidaste tu contrasena?")).toHaveAttribute(
      "href",
      "/forgot-password",
    );
    expect(screen.getByText("Registrate")).toHaveAttribute(
      "href",
      "/register",
    );
  });
});
