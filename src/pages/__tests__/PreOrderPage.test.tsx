import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import PreOrderPage from "../PreOrderPage";
import * as reservationService from "../../services/reservation.service";
import * as menuService from "../../services/menu.service";
import * as preOrderService from "../../services/pre-order.service";
import type {
  MenuItem,
  Reservation,
  ReservationItem,
} from "../../types/api";

vi.mock("../../services/reservation.service");
vi.mock("../../services/menu.service");
vi.mock("../../services/pre-order.service");

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "1" }),
    useNavigate: () => mockNavigate,
  };
});

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

const MOCK_RESERVATION: Reservation = {
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

const MOCK_MENU_ITEMS: MenuItem[] = [
  {
    id: 10,
    name: "Ensalada Cesar",
    description: "Lechuga romana con aderezo cesar",
    price: "8.50",
    category: "entrantes",
    is_available: true,
    daily_stock: 10,
    created_at: "2026-01-01",
  },
  {
    id: 20,
    name: "Lomo Saltado",
    description: "Carne de res salteada con verduras",
    price: "18.00",
    category: "principales",
    is_available: true,
    daily_stock: 5,
    created_at: "2026-01-01",
  },
  {
    id: 30,
    name: "Tiramisú",
    description: null,
    price: "7.00",
    category: "postres",
    is_available: false,
    daily_stock: 0,
    created_at: "2026-01-01",
  },
];

const MOCK_PRE_ORDER_ITEMS: ReservationItem[] = [
  {
    id: 100,
    quantity: 2,
    unit_price: "8.50",
    subtotal: "17.00",
    menu_item: { id: 10, name: "Ensalada Cesar", category: "entrantes" },
    created_at: "2026-04-09T10:00:00Z",
  },
];

function mockDefaultServices() {
  vi.mocked(reservationService.getById).mockResolvedValue({
    data: MOCK_RESERVATION,
  });
  vi.mocked(menuService.getMenuItems).mockResolvedValue({
    data: MOCK_MENU_ITEMS,
    meta: { current_page: 1, last_page: 1, per_page: 15, total: 3 },
  });
  vi.mocked(preOrderService.getItems).mockResolvedValue({
    data: MOCK_PRE_ORDER_ITEMS,
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <PreOrderPage />
    </MemoryRouter>,
  );
}

describe("PreOrderPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    vi.mocked(reservationService.getById).mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.getByText("Cargando...")).toBeInTheDocument();
  });

  it("renders reservation summary after fetch", async () => {
    mockDefaultServices();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("10/04/2026")).toBeInTheDocument();
    });

    expect(screen.getByText("19:00 - 21:00")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Mesa 1")).toBeInTheDocument();
  });

  it("shows error when reservation is not confirmed", async () => {
    vi.mocked(reservationService.getById).mockResolvedValue({
      data: { ...MOCK_RESERVATION, status: "pending" },
    });
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText("Esta reservacion no permite pre-ordenes."),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("Volver a mis reservaciones"),
    ).toBeInTheDocument();
  });

  it("shows error when reservation fetch fails", async () => {
    vi.mocked(reservationService.getById).mockRejectedValue(
      new Error("Error del servidor"),
    );
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Error del servidor")).toBeInTheDocument();
    });
  });

  it("renders menu items grouped by category", async () => {
    mockDefaultServices();
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("Ensalada Cesar").length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByRole("heading", { name: "Entrantes" })).toBeInTheDocument();
    expect(screen.getByText("Lomo Saltado")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Principales" })).toBeInTheDocument();
    expect(screen.getByText("Tiramisú")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Postres" })).toBeInTheDocument();
  });

  it("filters menu by category", async () => {
    mockDefaultServices();
    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getAllByText("Ensalada Cesar").length).toBeGreaterThanOrEqual(1);
    });

    vi.mocked(menuService.getMenuItems).mockResolvedValue({
      data: [MOCK_MENU_ITEMS[0]],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
    });

    await user.click(screen.getByRole("button", { name: "Entrantes" }));

    await waitFor(() => {
      expect(menuService.getMenuItems).toHaveBeenCalledWith("entrantes");
    });
  });

  it("adds an item to the pre-order", async () => {
    mockDefaultServices();

    const newItem: ReservationItem = {
      id: 101,
      quantity: 1,
      unit_price: "18.00",
      subtotal: "18.00",
      menu_item: { id: 20, name: "Lomo Saltado", category: "principales" },
      created_at: "2026-04-09T11:00:00Z",
    };

    vi.mocked(preOrderService.addItem).mockResolvedValue({ data: newItem });

    const updatedItems = [...MOCK_PRE_ORDER_ITEMS, newItem];
    vi.mocked(preOrderService.getItems)
      .mockResolvedValueOnce({ data: MOCK_PRE_ORDER_ITEMS })
      .mockResolvedValueOnce({ data: updatedItems });

    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getAllByText("Ensalada Cesar").length).toBeGreaterThanOrEqual(1);
    });

    const addButtons = screen.getAllByRole("button", { name: "Agregar" });
    const lomoButton = addButtons[1];

    await user.click(lomoButton);

    await waitFor(() => {
      expect(preOrderService.addItem).toHaveBeenCalledWith(1, {
        menu_item_id: 20,
        quantity: 1,
      });
    });

    await waitFor(() => {
      expect(screen.getAllByText("Lomo Saltado").length).toBe(2);
    });
  });

  it("removes an item from the pre-order", async () => {
    mockDefaultServices();
    vi.mocked(preOrderService.removeItem).mockResolvedValue(null);
    vi.mocked(preOrderService.getItems)
      .mockResolvedValueOnce({ data: MOCK_PRE_ORDER_ITEMS })
      .mockResolvedValueOnce({ data: [] });

    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText("Eliminar")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() => {
      expect(preOrderService.removeItem).toHaveBeenCalledWith(1, 100);
    });

    await waitFor(() => {
      expect(
        screen.getByText("No has agregado items aun."),
      ).toBeInTheDocument();
    });
  });

  it("shows subtotals and grand total", async () => {
    mockDefaultServices();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("2 x $8.50")).toBeInTheDocument();
    });

    const amounts = screen.getAllByText("$17.00");
    expect(amounts).toHaveLength(2);
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  it("shows error on add failure and can dismiss it", async () => {
    mockDefaultServices();
    vi.mocked(preOrderService.addItem).mockRejectedValue(
      new Error("Stock insuficiente"),
    );
    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getAllByText("Ensalada Cesar").length).toBeGreaterThanOrEqual(1);
    });

    const addButtons = screen.getAllByRole("button", { name: "Agregar" });
    await user.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Stock insuficiente")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(screen.queryByText("Stock insuficiente")).not.toBeInTheDocument();
  });

  it("shows error on remove failure", async () => {
    mockDefaultServices();
    vi.mocked(preOrderService.removeItem).mockRejectedValue(
      new Error("Error al eliminar"),
    );
    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText("Eliminar")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() => {
      expect(screen.getByText("Error al eliminar")).toBeInTheDocument();
    });
  });

  it("disables add button for unavailable items", async () => {
    mockDefaultServices();
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("Ensalada Cesar").length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText("Tiramisú")).toBeInTheDocument();
    expect(screen.getByText("No disponible")).toBeInTheDocument();

    const addButtons = screen.getAllByRole("button", { name: "Agregar" });
    const tiramisuButton = addButtons[2];
    expect(tiramisuButton).toBeDisabled();
  });
});
