import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import MyReservationsPage from "../MyReservationsPage";
import * as reservationService from "../../services/reservation.service";
import type { Reservation, PaginatedResponse } from "../../types/api";

vi.mock("../../services/reservation.service");

const mockToast = { success: vi.fn(), error: vi.fn(), dismiss: vi.fn(), toasts: [] };

vi.mock("../../context/ToastContext", () => ({
  useToast: () => mockToast,
}));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, name: "Test", email: "t@t.com", role: "client" },
    isAuthenticated: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    setSession: vi.fn(),
  }),
}));

const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 1,
    user_id: 1,
    seats_requested: 4,
    date: "2026-04-10",
    start_time: "19:00",
    end_time: "21:00",
    status: "confirmed",
    created_at: "2026-04-08T10:00:00Z",
  },
  {
    id: 2,
    user_id: 1,
    seats_requested: 2,
    date: "2026-04-12",
    start_time: "20:00",
    end_time: "22:00",
    status: "cancelled",
    created_at: "2026-04-09T10:00:00Z",
  },
  {
    id: 3,
    user_id: 1,
    seats_requested: 6,
    date: "2026-04-15",
    start_time: "13:00",
    end_time: "15:00",
    status: "pending",
    created_at: "2026-04-10T10:00:00Z",
  },
];

const MOCK_DETAIL: Reservation = {
  id: 1,
  user_id: 1,
  table: {
    id: 1,
    name: "Mesa 1",
    min_capacity: 2,
    max_capacity: 4,
    location: "Interior",
    description: null,
    is_active: true,
    created_at: "2026-01-01",
  },
  seats_requested: 4,
  date: "2026-04-10",
  start_time: "19:00",
  end_time: "21:00",
  status: "confirmed",
  payment: { amount: "40.00", status: "paid", paid_at: "2026-04-08T10:05:00Z" },
  created_at: "2026-04-08T10:00:00Z",
};

function mockGetAll(reservations: Reservation[] = MOCK_RESERVATIONS) {
  const response: PaginatedResponse<Reservation> = {
    data: reservations,
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: reservations.length,
    },
  };
  vi.mocked(reservationService.getAll).mockResolvedValue(response);
}

function mockGetById(detail: Reservation = MOCK_DETAIL) {
  vi.mocked(reservationService.getById).mockResolvedValue({ data: detail });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <MyReservationsPage />
    </MemoryRouter>,
  );
}

describe("MyReservationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state with skeleton cards", () => {
    vi.mocked(reservationService.getAll).mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.getByText("Mis reservaciones")).toBeInTheDocument();
  });

  it("renders reservation list after fetch", async () => {
    mockGetAll();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("10/04/2026")).toBeInTheDocument();
    });

    expect(screen.getByText("12/04/2026")).toBeInTheDocument();
    expect(screen.getByText("15/04/2026")).toBeInTheDocument();
  });

  it("shows empty state when no reservations", async () => {
    mockGetAll([]);
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText("Aun no tienes reservaciones"),
      ).toBeInTheDocument();
    });
  });

  it("shows error when fetch fails", async () => {
    vi.mocked(reservationService.getAll).mockRejectedValue(
      new Error("Error del servidor"),
    );
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Error del servidor")).toBeInTheDocument();
    });
  });

  it("displays correct status badges", async () => {
    mockGetAll();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Confirmada")).toBeInTheDocument();
    });

    expect(screen.getByText("Cancelada")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });

  it("expands accordion on click and shows detail", async () => {
    mockGetAll();
    mockGetById();
    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText("10/04/2026")).toBeInTheDocument();
    });

    await user.click(screen.getByText("10/04/2026"));

    await waitFor(() => {
      expect(screen.getByText("Mesa 1 · Interior")).toBeInTheDocument();
    });

    expect(screen.getByText("$40.00")).toBeInTheDocument();
    expect(screen.getByText("19:00 - 21:00")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("collapses accordion when clicking expanded item", async () => {
    mockGetAll();
    mockGetById();
    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText("10/04/2026")).toBeInTheDocument();
    });

    const headerButton = screen.getByText("10/04/2026").closest("button")!;
    await user.click(headerButton);

    await waitFor(() => {
      expect(screen.getByText("Mesa 1 · Interior")).toBeInTheDocument();
    });

    await user.click(headerButton);

    await waitFor(() => {
      expect(screen.queryByText("Mesa 1 · Interior")).not.toBeInTheDocument();
    });
  });

  it("shows detail loading state while fetching", async () => {
    mockGetAll();
    vi.mocked(reservationService.getById).mockReturnValue(
      new Promise(() => {}),
    );
    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText("10/04/2026")).toBeInTheDocument();
    });

    await user.click(screen.getByText("10/04/2026"));

    expect(screen.getByText("Cargando detalles...")).toBeInTheDocument();
  });

  it("shows cancel button only for cancellable statuses", async () => {
    mockGetAll();
    mockGetById();
    renderPage();
    const user = userEvent.setup();

    // Expand confirmed reservation — should show cancel
    await waitFor(() => {
      expect(screen.getByText("10/04/2026")).toBeInTheDocument();
    });

    await user.click(screen.getByText("10/04/2026"));

    await waitFor(() => {
      expect(screen.getByText("Mesa 1 · Interior")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: "Cancelar" }),
    ).toBeInTheDocument();
  });

  it("does not show cancel button for cancelled reservation", async () => {
    const cancelledDetail: Reservation = {
      ...MOCK_DETAIL,
      id: 2,
      status: "cancelled",
    };
    mockGetAll();
    vi.mocked(reservationService.getById).mockResolvedValue({
      data: cancelledDetail,
    });
    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText("12/04/2026")).toBeInTheDocument();
    });

    await user.click(screen.getByText("12/04/2026"));

    await waitFor(() => {
      expect(screen.getByText("Mesa 1 · Interior")).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", { name: "Cancelar" }),
    ).not.toBeInTheDocument();
  });

  it("opens cancel modal and cancels reservation on confirm", async () => {
    const cancelledReservation: Reservation = {
      ...MOCK_DETAIL,
      status: "cancelled",
    };
    vi.mocked(reservationService.cancel).mockResolvedValue({
      data: cancelledReservation,
    });
    mockGetAll();
    mockGetById();
    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText("10/04/2026")).toBeInTheDocument();
    });

    await user.click(screen.getByText("10/04/2026").closest("button")!);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Cancelar" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    // Modal should be open
    expect(
      screen.getByText(/Esta accion no se puede deshacer/),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Cancelar reservacion" }),
    );

    await waitFor(() => {
      expect(reservationService.cancel).toHaveBeenCalledWith(1);
    });

    // Status should update in the list
    const badges = screen.getAllByText("Cancelada");
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });

  it("closes cancel modal when Volver is clicked", async () => {
    mockGetAll();
    mockGetById();
    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText("10/04/2026")).toBeInTheDocument();
    });

    await user.click(screen.getByText("10/04/2026").closest("button")!);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Cancelar" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(
      screen.getByText(/Esta accion no se puede deshacer/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Volver" }));

    await waitFor(() => {
      expect(
        screen.queryByText(/Esta accion no se puede deshacer/),
      ).not.toBeInTheDocument();
    });
  });

  it("shows pre-order link for confirmed reservations", async () => {
    mockGetAll();
    mockGetById();
    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText("10/04/2026")).toBeInTheDocument();
    });

    await user.click(screen.getByText("10/04/2026"));

    await waitFor(() => {
      expect(screen.getByText("Pre-ordenar")).toBeInTheDocument();
    });

    const link = screen.getByRole("link", { name: "Pre-ordenar" });
    expect(link).toHaveAttribute("href", "/my-reservations/1/pre-order");
  });

  it("does not show pre-order link for pending reservations", async () => {
    const pendingDetail: Reservation = {
      ...MOCK_DETAIL,
      id: 3,
      status: "pending",
    };
    mockGetAll();
    vi.mocked(reservationService.getById).mockResolvedValue({
      data: pendingDetail,
    });
    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText("15/04/2026")).toBeInTheDocument();
    });

    await user.click(screen.getByText("15/04/2026"));

    await waitFor(() => {
      expect(screen.getByText("Mesa 1 · Interior")).toBeInTheDocument();
    });

    expect(screen.queryByText("Pre-ordenar")).not.toBeInTheDocument();
  });

  it("shows cancel error as toast without destroying the list", async () => {
    vi.mocked(reservationService.cancel).mockRejectedValue(
      new Error("No se puede cancelar"),
    );
    mockGetAll();
    mockGetById();
    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText("10/04/2026")).toBeInTheDocument();
    });

    await user.click(screen.getByText("10/04/2026").closest("button")!);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Cancelar" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.click(
      screen.getByRole("button", { name: "Cancelar reservacion" }),
    );

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("No se puede cancelar");
    });

    // List should still be visible
    expect(screen.getAllByText("10/04/2026").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("12/04/2026")).toBeInTheDocument();
  });

  it("closes modal when clicking on overlay", async () => {
    mockGetAll();
    mockGetById();
    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText("10/04/2026")).toBeInTheDocument();
    });

    await user.click(screen.getByText("10/04/2026").closest("button")!);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Cancelar" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(
      screen.getByText(/Esta accion no se puede deshacer/),
    ).toBeInTheDocument();

    // Click on the overlay (the outer div of the modal)
    const overlay = screen.getByText(/Esta accion no se puede deshacer/)
      .closest(".fixed")!;
    await user.click(overlay);

    await waitFor(() => {
      expect(
        screen.queryByText(/Esta accion no se puede deshacer/),
      ).not.toBeInTheDocument();
    });
  });
});
