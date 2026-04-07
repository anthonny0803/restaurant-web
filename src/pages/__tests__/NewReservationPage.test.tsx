import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import NewReservationPage from "../NewReservationPage";
import * as reservationService from "../../services/reservation.service";
import * as guestService from "../../services/guest.service";
import { ApiValidationError } from "../../lib/api";
import type { Table } from "../../types/api";

vi.mock("../../services/reservation.service");
vi.mock("../../services/guest.service");

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

let mockIsAuthenticated = false;

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: mockIsAuthenticated ? { id: 1, name: "Test", email: "t@t.com", role: "client" } : null,
    isAuthenticated: mockIsAuthenticated,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    setSession: vi.fn(),
  }),
}));

const MOCK_TABLES: Table[] = [
  {
    id: 1,
    name: "Mesa 1",
    min_capacity: 2,
    max_capacity: 4,
    location: "Interior",
    description: null,
    is_active: true,
    created_at: "2026-01-01",
  },
  {
    id: 2,
    name: "Mesa 2",
    min_capacity: 4,
    max_capacity: 8,
    location: "Terraza",
    description: null,
    is_active: true,
    created_at: "2026-01-01",
  },
];

function mockAvailableTables(tables: Table[] = MOCK_TABLES) {
  vi.mocked(reservationService.getAvailableTables).mockResolvedValue({
    data: tables,
  });
}

function mockCreateHold() {
  vi.mocked(reservationService.createHold).mockResolvedValue({
    data: {
      reservation: { id: 10 } as never,
      payment_intent_client_secret: "pi_secret_123",
    },
  });
}

function mockCreateGuestReservation() {
  vi.mocked(guestService.createGuestReservation).mockResolvedValue({
    data: {
      reservation: { id: 11 } as never,
      payment_intent_client_secret: "pi_secret_456",
    },
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <NewReservationPage />
    </MemoryRouter>,
  );
}

async function fillSearchAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Fecha"), "2026-04-10");
  await user.selectOptions(screen.getByLabelText("Hora"), "19:00");
  await user.clear(screen.getByLabelText("Personas"));
  await user.type(screen.getByLabelText("Personas"), "4");
  await user.click(
    screen.getByRole("button", { name: "Buscar mesas disponibles" }),
  );
}

describe("NewReservationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = false;
  });

  describe("Step 1 - Search", () => {
    it("renders search form with date, time, and seats fields", () => {
      renderPage();

      expect(screen.getByLabelText("Fecha")).toBeInTheDocument();
      expect(screen.getByLabelText("Hora")).toBeInTheDocument();
      expect(screen.getByLabelText("Personas")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Buscar mesas disponibles" }),
      ).toBeInTheDocument();
    });

    it("renders step indicators", () => {
      renderPage();

      expect(screen.getByText("Buscar")).toBeInTheDocument();
      expect(screen.getByText("Elegir mesa")).toBeInTheDocument();
      expect(screen.getByText("Confirmar")).toBeInTheDocument();
    });

    it("calls getAvailableTables and moves to step 2", async () => {
      mockAvailableTables();
      renderPage();
      const user = userEvent.setup();

      await fillSearchAndSubmit(user);

      await waitFor(() => {
        expect(
          reservationService.getAvailableTables,
        ).toHaveBeenCalledWith({
          date: "2026-04-10",
          start_time: "19:00",
          seats_requested: 4,
        });
      });

      expect(screen.getByText("Mesa 1")).toBeInTheDocument();
      expect(screen.getByText("Mesa 2")).toBeInTheDocument();
    });

    it("shows error when no tables are available", async () => {
      mockAvailableTables([]);
      renderPage();
      const user = userEvent.setup();

      await fillSearchAndSubmit(user);

      await waitFor(() => {
        expect(
          screen.getByText(
            "No hay mesas disponibles para los criterios seleccionados.",
          ),
        ).toBeInTheDocument();
      });
    });

    it("shows error when API call fails", async () => {
      vi.mocked(reservationService.getAvailableTables).mockRejectedValue(
        new Error("Error del servidor"),
      );
      renderPage();
      const user = userEvent.setup();

      await fillSearchAndSubmit(user);

      await waitFor(() => {
        expect(screen.getByText("Error del servidor")).toBeInTheDocument();
      });
    });
  });

  describe("Step 2 - Table selection", () => {
    async function goToStep2() {
      mockAvailableTables();
      renderPage();
      const user = userEvent.setup();
      await fillSearchAndSubmit(user);
      await waitFor(() => {
        expect(screen.getByText("Mesa 1")).toBeInTheDocument();
      });
      return user;
    }

    it("displays table count and details", async () => {
      await goToStep2();

      expect(screen.getByText(/2 mesas disponibles/)).toBeInTheDocument();
      expect(screen.getByText("2-4 personas · Interior")).toBeInTheDocument();
      expect(screen.getByText("4-8 personas · Terraza")).toBeInTheDocument();
    });

    it("allows selecting a table and continuing", async () => {
      const user = await goToStep2();

      await user.click(screen.getByText("Mesa 1"));
      await user.click(screen.getByRole("button", { name: "Continuar" }));

      expect(
        screen.getByRole("heading", { name: "Resumen" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Mesa 1")).toBeInTheDocument();
    });

    it("disables continue button when no table selected", async () => {
      await goToStep2();

      expect(
        screen.getByRole("button", { name: "Continuar" }),
      ).toBeDisabled();
    });

    it("goes back to step 1 when Volver is clicked", async () => {
      const user = await goToStep2();

      await user.click(screen.getByRole("button", { name: "Volver" }));

      expect(screen.getByLabelText("Fecha")).toBeInTheDocument();
    });
  });

  describe("Step 3 - Registered user hold", () => {
    async function goToStep3Registered() {
      mockIsAuthenticated = true;
      mockAvailableTables();
      renderPage();
      const user = userEvent.setup();

      await fillSearchAndSubmit(user);
      await waitFor(() => {
        expect(screen.getByText("Mesa 1")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Mesa 1"));
      await user.click(screen.getByRole("button", { name: "Continuar" }));

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Resumen" }),
        ).toBeInTheDocument();
      });

      return user;
    }

    it("shows summary and reserve button for authenticated user", async () => {
      await goToStep3Registered();

      expect(screen.getByText("Mesa 1")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Reservar" }),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument();
    });

    it("creates hold and navigates to payment", async () => {
      mockCreateHold();
      const user = await goToStep3Registered();

      await user.click(screen.getByRole("button", { name: "Reservar" }));

      await waitFor(() => {
        expect(reservationService.createHold).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith("/payment", {
          state: { clientSecret: "pi_secret_123", reservationId: 10 },
        });
      });
    });

    it("shows error when hold creation fails", async () => {
      vi.mocked(reservationService.createHold).mockRejectedValue(
        new Error("Ya tienes una reservacion pendiente"),
      );
      const user = await goToStep3Registered();

      await user.click(screen.getByRole("button", { name: "Reservar" }));

      await waitFor(() => {
        expect(
          screen.getByText("Ya tienes una reservacion pendiente"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Step 3 - Guest hold", () => {
    async function goToStep3Guest() {
      mockIsAuthenticated = false;
      mockAvailableTables();
      renderPage();
      const user = userEvent.setup();

      await fillSearchAndSubmit(user);
      await waitFor(() => {
        expect(screen.getByText("Mesa 1")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Mesa 1"));
      await user.click(screen.getByRole("button", { name: "Continuar" }));

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Resumen" }),
        ).toBeInTheDocument();
      });

      return user;
    }

    it("shows guest form for unauthenticated user", async () => {
      await goToStep3Guest();

      expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
      expect(
        screen.getByLabelText("Correo electronico"),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Telefono")).toBeInTheDocument();
    });

    it("creates guest hold and navigates to payment", async () => {
      mockCreateGuestReservation();
      const user = await goToStep3Guest();

      await user.type(screen.getByLabelText("Nombre"), "Juan Perez");
      await user.type(
        screen.getByLabelText("Correo electronico"),
        "juan@email.com",
      );
      await user.type(screen.getByLabelText("Telefono"), "1234567890");
      await user.click(screen.getByRole("button", { name: "Reservar" }));

      await waitFor(() => {
        expect(guestService.createGuestReservation).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith("/payment", {
          state: { clientSecret: "pi_secret_456", reservationId: 11 },
        });
      });
    });

    it("displays field errors on 422 validation error", async () => {
      vi.mocked(guestService.createGuestReservation).mockRejectedValue(
        new ApiValidationError({
          message: "Validation failed",
          errors: { email: ["El correo ya esta registrado"] },
        }),
      );
      const user = await goToStep3Guest();

      await user.click(screen.getByRole("button", { name: "Reservar" }));

      await waitFor(() => {
        expect(
          screen.getByText("El correo ya esta registrado"),
        ).toBeInTheDocument();
      });
    });
  });
});
