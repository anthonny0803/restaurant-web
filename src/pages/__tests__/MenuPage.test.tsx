import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MenuPage from "../MenuPage";
import * as menuService from "../../services/menu.service";
import type { MenuItem, PaginatedResponse } from "../../types/api";

vi.mock("../../services/menu.service");

const MOCK_ITEMS: MenuItem[] = [
  {
    id: 1,
    name: "Bruschetta",
    description: "Pan tostado con tomate",
    price: "8.50",
    category: "entrantes",
    is_available: true,
    daily_stock: null,
    created_at: "2026-01-01",
  },
  {
    id: 2,
    name: "Risotto",
    description: null,
    price: "18.00",
    category: "principales",
    is_available: true,
    daily_stock: 10,
    created_at: "2026-01-01",
  },
  {
    id: 3,
    name: "Tiramisu",
    description: "Postre italiano clasico",
    price: "9.00",
    category: "postres",
    is_available: true,
    daily_stock: null,
    created_at: "2026-01-01",
  },
];

function mockGetMenuItems(items: MenuItem[] = MOCK_ITEMS) {
  const response: PaginatedResponse<MenuItem> = {
    data: items,
    meta: { current_page: 1, last_page: 1, per_page: 15, total: items.length },
  };
  vi.mocked(menuService.getMenuItems).mockResolvedValue(response);
}

describe("MenuPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    vi.mocked(menuService.getMenuItems).mockReturnValue(
      new Promise(() => {}),
    );
    render(<MenuPage />);

    expect(screen.getByText("Cargando menu...")).toBeInTheDocument();
  });

  it("renders items grouped by category", async () => {
    mockGetMenuItems();
    render(<MenuPage />);

    await waitFor(() => {
      expect(screen.getByText("Bruschetta")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("heading", { name: "Entrantes" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Principales" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Postres" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Risotto")).toBeInTheDocument();
    expect(screen.getByText("Tiramisu")).toBeInTheDocument();
  });

  it("shows item description when available", async () => {
    mockGetMenuItems();
    render(<MenuPage />);

    await waitFor(() => {
      expect(screen.getByText("Pan tostado con tomate")).toBeInTheDocument();
    });
  });

  it("shows item price", async () => {
    mockGetMenuItems();
    render(<MenuPage />);

    await waitFor(() => {
      expect(screen.getByText("$8.50")).toBeInTheDocument();
    });
  });

  it("filters by category when a tab is clicked", async () => {
    mockGetMenuItems();
    render(<MenuPage />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText("Bruschetta")).toBeInTheDocument();
    });

    const entreesOnly: MenuItem[] = [MOCK_ITEMS[0]];
    mockGetMenuItems(entreesOnly);

    await user.click(screen.getByRole("button", { name: "Entrantes" }));

    await waitFor(() => {
      expect(menuService.getMenuItems).toHaveBeenLastCalledWith("entrantes");
    });
  });

  it("shows all items when Todos tab is clicked after filtering", async () => {
    mockGetMenuItems();
    render(<MenuPage />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText("Bruschetta")).toBeInTheDocument();
    });

    mockGetMenuItems([MOCK_ITEMS[0]]);
    await user.click(screen.getByRole("button", { name: "Entrantes" }));

    await waitFor(() => {
      expect(menuService.getMenuItems).toHaveBeenLastCalledWith("entrantes");
    });

    mockGetMenuItems();
    await user.click(screen.getByRole("button", { name: "Todos" }));

    await waitFor(() => {
      expect(menuService.getMenuItems).toHaveBeenLastCalledWith(undefined);
    });
  });

  it("shows error message when fetch fails", async () => {
    vi.mocked(menuService.getMenuItems).mockRejectedValue(
      new Error("Error del servidor"),
    );
    render(<MenuPage />);

    await waitFor(() => {
      expect(screen.getByText("Error del servidor")).toBeInTheDocument();
    });
  });

  it("shows empty state when no items are returned", async () => {
    mockGetMenuItems([]);
    render(<MenuPage />);

    await waitFor(() => {
      expect(
        screen.getByText("No hay items disponibles."),
      ).toBeInTheDocument();
    });
  });
});
