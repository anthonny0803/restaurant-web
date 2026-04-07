import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import RegisterPage from "../RegisterPage";
import { ApiValidationError } from "../../lib/api";

const mockRegister = vi.fn();
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    login: vi.fn(),
    register: mockRegister,
    logout: vi.fn(),
    setSession: vi.fn(),
  }),
}));

function renderRegisterPage() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  );
}

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all fields and submit button", () => {
    renderRegisterPage();

    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
    expect(screen.getByLabelText("Correo electronico")).toBeInTheDocument();
    expect(screen.getByLabelText("Telefono")).toBeInTheDocument();
    expect(screen.getByLabelText("Contrasena")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar contrasena")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Registrarse" }),
    ).toBeInTheDocument();
  });

  it("calls register and navigates to / on successful submit", async () => {
    mockRegister.mockResolvedValue(undefined);
    renderRegisterPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Nombre"), "Juan Perez");
    await user.type(
      screen.getByLabelText("Correo electronico"),
      "juan@email.com",
    );
    await user.type(screen.getByLabelText("Telefono"), "1234567890");
    await user.type(screen.getByLabelText("Contrasena"), "password123");
    await user.type(
      screen.getByLabelText("Confirmar contrasena"),
      "password123",
    );
    await user.click(screen.getByRole("button", { name: "Registrarse" }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: "Juan Perez",
        email: "juan@email.com",
        phone: "1234567890",
        password: "password123",
        password_confirmation: "password123",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("displays field errors on 422 validation error", async () => {
    mockRegister.mockRejectedValue(
      new ApiValidationError({
        message: "Validation failed",
        errors: {
          email: ["El correo ya esta registrado"],
          phone: ["El telefono es obligatorio"],
        },
      }),
    );
    renderRegisterPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Registrarse" }));

    await waitFor(() => {
      expect(
        screen.getByText("El correo ya esta registrado"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("El telefono es obligatorio"),
      ).toBeInTheDocument();
    });
  });

  it("displays general error for non-validation errors", async () => {
    mockRegister.mockRejectedValue(new Error("Error del servidor"));
    renderRegisterPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Registrarse" }));

    await waitFor(() => {
      expect(screen.getByText("Error del servidor")).toBeInTheDocument();
    });
  });

  it("renders link to login", () => {
    renderRegisterPage();

    expect(screen.getByText("Inicia sesion")).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
