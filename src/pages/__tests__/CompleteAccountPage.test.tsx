import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CompleteAccountPage from "../CompleteAccountPage";
import * as authService from "../../services/auth.service";
import { ApiValidationError } from "../../lib/api";

vi.mock("../../services/auth.service");

const mockNavigate = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, name: "Guest", email: "guest@test.com", role: "client" },
    isAuthenticated: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    setSession: vi.fn(),
    updateUser: mockUpdateUser,
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CompleteAccountPage />
    </MemoryRouter>,
  );
}

describe("CompleteAccountPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders password fields and submit button", () => {
    renderPage();

    expect(screen.getByLabelText("Contrasena")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar contrasena")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Completar cuenta" }),
    ).toBeInTheDocument();
  });

  it("submits successfully, calls updateUser and navigates to /my-reservations", async () => {
    vi.mocked(authService.completeAccount).mockResolvedValue({
      data: { id: 1, name: "Guest", email: "guest@test.com", phone: "612345678", role: "client", is_guest: false },
    });
    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Contrasena"), "mypassword");
    await user.type(
      screen.getByLabelText("Confirmar contrasena"),
      "mypassword",
    );
    await user.click(
      screen.getByRole("button", { name: "Completar cuenta" }),
    );

    await waitFor(() => {
      expect(authService.completeAccount).toHaveBeenCalledWith({
        password: "mypassword",
        password_confirmation: "mypassword",
      });
      expect(mockUpdateUser).toHaveBeenCalledWith(
        { id: 1, name: "Guest", email: "guest@test.com", phone: "612345678", role: "client", is_guest: false },
      );
      expect(mockNavigate).toHaveBeenCalledWith("/my-reservations");
    });
  });

  it("displays field errors on 422 validation error", async () => {
    vi.mocked(authService.completeAccount).mockRejectedValue(
      new ApiValidationError({
        message: "Validation failed",
        errors: {
          password: ["La contrasena debe tener al menos 8 caracteres"],
        },
      }),
    );
    renderPage();
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: "Completar cuenta" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("La contrasena debe tener al menos 8 caracteres"),
      ).toBeInTheDocument();
    });
  });

  it("displays generic error for non-validation failures", async () => {
    vi.mocked(authService.completeAccount).mockRejectedValue(
      new Error("Error del servidor"),
    );
    renderPage();
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: "Completar cuenta" }),
    );

    await waitFor(() => {
      expect(screen.getByText("Error del servidor")).toBeInTheDocument();
    });
  });
});
