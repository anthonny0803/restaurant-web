import { useState } from "react";
import type { MenuCategory, MenuItem } from "../types/api";

const CATEGORIES: { value: MenuCategory; label: string }[] = [
  { value: "entrantes", label: "Entrantes" },
  { value: "principales", label: "Principales" },
  { value: "postres", label: "Postres" },
  { value: "bebidas", label: "Bebidas" },
];

interface MenuBrowserProps {
  items: MenuItem[];
  activeCategory: MenuCategory | null;
  isLoading: boolean;
  error: string;
  addingItemId: number | null;
  onCategoryChange: (category: MenuCategory | null) => void;
  onAddItem: (menuItemId: number, quantity: number) => void;
}

function MenuItemCard({
  item,
  addingItemId,
  onAddItem,
}: {
  item: MenuItem;
  addingItemId: number | null;
  onAddItem: (menuItemId: number, quantity: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const isAdding = addingItemId === item.id;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-gray-900">{item.name}</h3>
          {item.description && (
            <p className="mt-1 text-sm text-gray-500">{item.description}</p>
          )}
        </div>
        <span className="shrink-0 font-semibold text-indigo-600">
          ${item.price}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          disabled={!item.is_available || isAdding}
          className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => onAddItem(item.id, quantity)}
          disabled={!item.is_available || isAdding}
          className="rounded-md bg-indigo-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {isAdding ? "Agregando..." : "Agregar"}
        </button>
      </div>

      {!item.is_available && (
        <p className="mt-1 text-xs text-red-500">No disponible</p>
      )}
    </div>
  );
}

export default function MenuBrowser({
  items,
  activeCategory,
  isLoading,
  error,
  addingItemId,
  onCategoryChange,
  onAddItem,
}: MenuBrowserProps) {
  const groupedItems = activeCategory
    ? { [activeCategory]: items }
    : items.reduce<Record<string, MenuItem[]>>((acc, item) => {
        const group = acc[item.category] ?? [];
        group.push(item);
        acc[item.category] = group;
        return acc;
      }, {});

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900">Menu</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onCategoryChange(null)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors
            ${!activeCategory
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          Todos
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => onCategoryChange(cat.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors
              ${activeCategory === cat.value
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="mt-6 text-gray-500">Cargando menu...</p>}

      {error && <p className="mt-6 text-red-600">{error}</p>}

      {!isLoading && !error && items.length === 0 && (
        <p className="mt-6 text-gray-500">No hay items disponibles.</p>
      )}

      {!isLoading && !error && items.length > 0 && (
        <div className="mt-6 space-y-8">
          {CATEGORIES.filter((cat) => groupedItems[cat.value]).map((cat) => (
            <section key={cat.value}>
              <h3 className="text-lg font-semibold text-gray-800">
                {cat.label}
              </h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {groupedItems[cat.value].map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    addingItemId={addingItemId}
                    onAddItem={onAddItem}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
