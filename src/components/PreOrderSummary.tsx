import type { ReservationItem } from "../types/api";

interface PreOrderSummaryProps {
  items: ReservationItem[];
  removingItemId: number | null;
  onRemoveItem: (itemId: number) => void;
}

export default function PreOrderSummary({
  items,
  removingItemId,
  onRemoveItem,
}: PreOrderSummaryProps) {
  const total = items.reduce((sum, item) => sum + Number(item.subtotal), 0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 lg:sticky lg:top-8">
      <h2 className="text-xl font-semibold text-gray-900">Tu pre-orden</h2>

      {items.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">
          No has agregado items aun.
        </p>
      )}

      {items.length > 0 && (
        <>
          <div className="mt-4 divide-y divide-gray-100">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {item.menu_item.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {item.quantity} x ${item.unit_price}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900">
                    ${item.subtotal}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    disabled={removingItemId === item.id}
                    className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    {removingItemId === item.id ? "..." : "Eliminar"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between border-t border-gray-200 pt-4">
            <span className="text-lg font-semibold text-gray-900">Total</span>
            <span className="text-lg font-semibold text-indigo-600">
              ${total.toFixed(2)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
