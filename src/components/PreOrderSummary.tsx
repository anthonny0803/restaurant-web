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
    <div className="rounded-sm border border-zinc-800 bg-zinc-800 p-6 shadow-lg lg:sticky lg:top-24">
      <h2 className="font-serif text-xl font-medium text-white">Tu pre-orden</h2>

      {items.length === 0 && (
        <p className="mt-4 text-sm text-zinc-500">
          No has agregado items aun.
        </p>
      )}

      {items.length > 0 && (
        <>
          <div className="mt-4 divide-y divide-zinc-700">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="font-medium text-zinc-200">
                    {item.menu_item.name}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {item.quantity} x ${item.unit_price}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-white">
                    ${item.subtotal}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    disabled={removingItemId === item.id}
                    className="cursor-pointer text-sm font-medium text-red-400 transition-colors duration-200 hover:text-red-300 disabled:opacity-50"
                  >
                    {removingItemId === item.id ? "..." : "Eliminar"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between border-t border-zinc-700 pt-4">
            <span className="text-lg font-semibold text-white">Total</span>
            <span className="text-lg font-semibold text-amber-500">
              ${total.toFixed(2)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
