import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import PaymentPage from "../PaymentPage";
import type { Reservation } from "../../types/api";

const mockConfirmPayment = vi.fn();
let mockStripe: unknown = { confirmPayment: mockConfirmPayment };
let mockElements: unknown = {};

vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PaymentElement: () => <div data-testid="payment-element" />,
  useStripe: () => mockStripe,
  useElements: () => mockElements,
}));

vi.mock("../../lib/stripe", () => ({
  stripePromise: Promise.resolve({}),
}));

const mockNavigate = vi.fn();
let mockLocationState: unknown = null;

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      state: mockLocationState,
      pathname: "/payment",
      search: "",
      hash: "",
      key: "default",
    }),
  };
});

let mockIsAuthenticated = false;

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: mockIsAuthenticated
      ? { id: 1, name: "Test", email: "t@t.com", role: "client" }
      : null,
    isAuthenticated: mockIsAuthenticated,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    setSession: vi.fn(),
  }),
}));

const MOCK_RESERVATION: Reservation = {
  id: 10,
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
  status: "pending",
  expires_at: "2099-12-31T23:59:59Z",
  payment: { amount: "40.00", status: "pending", paid_at: "" },
  created_at: "2026-04-08T10:00:00Z",
};

function renderPage() {
  return render(
    <MemoryRouter>
      <PaymentPage />
    </MemoryRouter>,
  );
}

describe("PaymentPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = false;
    mockStripe = { confirmPayment: mockConfirmPayment };
    mockElements = {};
    mockLocationState = null;
  });

  describe("missing route state", () => {
    it("redirects to /reservations/new when state is null", () => {
      mockLocationState = null;
      renderPage();

      expect(
        screen.queryByTestId("payment-element"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Pago")).not.toBeInTheDocument();
    });

    it("redirects when clientSecret is missing", () => {
      mockLocationState = { reservation: MOCK_RESERVATION };
      renderPage();

      expect(
        screen.queryByTestId("payment-element"),
      ).not.toBeInTheDocument();
    });

    it("redirects when reservation is missing", () => {
      mockLocationState = { clientSecret: "pi_secret_123" };
      renderPage();

      expect(
        screen.queryByTestId("payment-element"),
      ).not.toBeInTheDocument();
    });
  });

  describe("reservation summary", () => {
    beforeEach(() => {
      mockLocationState = {
        clientSecret: "pi_secret_123",
        reservation: MOCK_RESERVATION,
      };
    });

    it("displays reservation details", () => {
      renderPage();

      expect(screen.getByText("2026-04-10")).toBeInTheDocument();
      expect(screen.getByText("19:00")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("Mesa 1")).toBeInTheDocument();
      expect(screen.getByText("$40.00")).toBeInTheDocument();
    });

    it("renders PaymentElement and submit button", () => {
      renderPage();

      expect(screen.getByTestId("payment-element")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Pagar deposito" }),
      ).toBeInTheDocument();
    });
  });

  describe("expired reservation", () => {
    it("shows expiration message and hides payment form", () => {
      mockLocationState = {
        clientSecret: "pi_secret_123",
        reservation: {
          ...MOCK_RESERVATION,
          expires_at: "2020-01-01T00:00:00Z",
        },
      };
      renderPage();

      expect(
        screen.getByText("Tu reservacion ha expirado. Por favor, crea una nueva."),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Crear nueva reservacion"),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("payment-element"),
      ).not.toBeInTheDocument();
    });
  });

  describe("payment submission", () => {
    beforeEach(() => {
      mockLocationState = {
        clientSecret: "pi_secret_123",
        reservation: MOCK_RESERVATION,
      };
    });

    it("shows Stripe error inline on failure", async () => {
      mockConfirmPayment.mockResolvedValue({
        error: { message: "Tu tarjeta fue rechazada" },
      });
      renderPage();
      const user = userEvent.setup();

      await user.click(
        screen.getByRole("button", { name: "Pagar deposito" }),
      );

      await waitFor(() => {
        expect(
          screen.getByText("Tu tarjeta fue rechazada"),
        ).toBeInTheDocument();
      });
    });

    it("shows button as processing during submission", async () => {
      let resolvePayment: (value: unknown) => void;
      mockConfirmPayment.mockReturnValue(
        new Promise((resolve) => {
          resolvePayment = resolve;
        }),
      );
      renderPage();
      const user = userEvent.setup();

      await user.click(
        screen.getByRole("button", { name: "Pagar deposito" }),
      );

      expect(screen.getByText("Procesando...")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Procesando..." }),
      ).toBeDisabled();

      await act(async () => {
        resolvePayment!({ error: undefined });
      });
    });

    it("navigates to /my-reservations on success for authenticated user", async () => {
      mockIsAuthenticated = true;
      mockConfirmPayment.mockResolvedValue({ error: undefined });
      renderPage();
      const user = userEvent.setup();

      await user.click(
        screen.getByRole("button", { name: "Pagar deposito" }),
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/my-reservations");
      });
    });

    it("shows success message for guest user", async () => {
      mockIsAuthenticated = false;
      mockConfirmPayment.mockResolvedValue({ error: undefined });
      renderPage();
      const user = userEvent.setup();

      await user.click(
        screen.getByRole("button", { name: "Pagar deposito" }),
      );

      await waitFor(() => {
        expect(
          screen.getByText("Tu reservacion ha sido confirmada."),
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            "Recibiras un correo con los detalles de tu reservacion.",
          ),
        ).toBeInTheDocument();
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
