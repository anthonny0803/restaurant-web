import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import MenuBrowser from "../components/MenuBrowser";
import PreOrderSummary from "../components/PreOrderSummary";
import * as reservationService from "../services/reservation.service";
import * as menuService from "../services/menu.service";
import * as preOrderService from "../services/pre-order.service";
import type {
  MenuCategory,
  MenuItem,
  Reservation,
  ReservationItem,
} from "../types/api";

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function formatTime(timeStr: string) {
  return timeStr.slice(0, 5);
}

export default function PreOrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [preOrderItems, setPreOrderItems] = useState<ReservationItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<MenuCategory | null>(
    null,
  );
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isMenuLoading, setIsMenuLoading] = useState(false);
  const [error, setError] = useState("");
  const [menuError, setMenuError] = useState("");
  const [orderError, setOrderError] = useState("");
  const [addingItemId, setAddingItemId] = useState<number | null>(null);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);

  const reservationId = Number(id);

  useEffect(() => {
    if (Number.isNaN(reservationId)) {
      navigate("/my-reservations", { replace: true });
      return;
    }

    reservationService
      .getById(reservationId)
      .then((response) => {
        if (response.data.status !== "confirmed") {
          setError("Esta reservacion no permite pre-ordenes.");
          setIsPageLoading(false);
          return;
        }

        setReservation(response.data);

        return Promise.all([
          menuService.getMenuItems(),
          preOrderService.getItems(reservationId),
        ]).then(([menuResponse, preOrderResponse]) => {
          setMenuItems(menuResponse.data);
          setPreOrderItems(preOrderResponse.data);
          setIsPageLoading(false);
        });
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Error al cargar la reservacion";
        setError(message);
        setIsPageLoading(false);
      });
  }, [reservationId, navigate]);

  const [categoryInitialized, setCategoryInitialized] = useState(false);

  useEffect(() => {
    if (!reservation) return;

    if (!categoryInitialized) {
      setCategoryInitialized(true);
      return;
    }

    setMenuError("");
    setIsMenuLoading(true);

    const category = activeCategory ?? undefined;
    menuService
      .getMenuItems(category)
      .then((response) => setMenuItems(response.data))
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Error al cargar el menu";
        setMenuError(message);
      })
      .finally(() => setIsMenuLoading(false));
  }, [activeCategory, reservation, categoryInitialized]);

  function refreshPreOrderItems() {
    return preOrderService
      .getItems(reservationId)
      .then((response) => setPreOrderItems(response.data));
  }

  function handleAddItem(menuItemId: number, quantity: number) {
    setAddingItemId(menuItemId);
    setOrderError("");

    preOrderService
      .addItem(reservationId, { menu_item_id: menuItemId, quantity })
      .then(() => refreshPreOrderItems())
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Error al agregar item";
        setOrderError(message);
      })
      .finally(() => setAddingItemId(null));
  }

  function handleRemoveItem(itemId: number) {
    setRemovingItemId(itemId);
    setOrderError("");

    preOrderService
      .removeItem(reservationId, itemId)
      .then(() => refreshPreOrderItems())
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Error al eliminar item";
        setOrderError(message);
      })
      .finally(() => setRemovingItemId(null));
  }

  if (isPageLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-center text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="rounded-md bg-red-50 p-4 text-center text-red-600">
          {error}
        </p>
        <div className="mt-4 text-center">
          <Link
            to="/my-reservations"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            Volver a mis reservaciones
          </Link>
        </div>
      </div>
    );
  }

  if (!reservation) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        to="/my-reservations"
        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
      >
        &larr; Volver a mis reservaciones
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-gray-900">Pre-orden</h1>

      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <span className="text-gray-500">Fecha</span>
            <p className="font-medium text-gray-900">
              {formatDate(reservation.date)}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Horario</span>
            <p className="font-medium text-gray-900">
              {formatTime(reservation.start_time)} -{" "}
              {formatTime(reservation.end_time)}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Personas</span>
            <p className="font-medium text-gray-900">
              {reservation.seats_requested}
            </p>
          </div>
          {reservation.table && (
            <div>
              <span className="text-gray-500">Mesa</span>
              <p className="font-medium text-gray-900">
                {reservation.table.name}
              </p>
            </div>
          )}
        </div>
      </div>

      {orderError && (
        <div className="mt-4 flex items-center justify-between rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-600">{orderError}</p>
          <button
            type="button"
            onClick={() => setOrderError("")}
            className="text-sm font-medium text-red-600 hover:text-red-800"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <MenuBrowser
            items={menuItems}
            activeCategory={activeCategory}
            isLoading={isMenuLoading}
            error={menuError}
            addingItemId={addingItemId}
            onCategoryChange={setActiveCategory}
            onAddItem={handleAddItem}
          />
        </div>
        <div className="lg:col-span-2">
          <PreOrderSummary
            items={preOrderItems}
            removingItemId={removingItemId}
            onRemoveItem={handleRemoveItem}
          />
        </div>
      </div>
    </div>
  );
}
