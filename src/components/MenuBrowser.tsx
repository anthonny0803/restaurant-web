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
    <div className="rounded-sm border border-zinc-700 bg-zinc-800 p-5 transition-colors duration-200 hover:border-zinc-600">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-zinc-200">{item.name}</h3>
          {item.description && (
            <p className="mt-1 text-sm text-zinc-500">{item.description}</p>
          )}
        </div>
        <span className="shrink-0 font-medium text-amber-500">
          ${item.price}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          disabled={!item.is_available || isAdding}
          className="w-16 rounded-sm border border-zinc-600 bg-zinc-700 px-2 py-1 text-sm text-white outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => onAddItem(item.id, quantity)}
          disabled={!item.is_available || isAdding}
          className="rounded-sm bg-amber-500 px-3 py-1 text-sm font-medium text-zinc-900 transition-colors duration-200 hover:bg-amber-400 disabled:opacity-50"
        >
          {isAdding ? "Agregando..." : "Agregar"}
        </button>
      </div>

      {!item.is_available && (
        <p className="mt-2 text-xs text-red-400">No disponible</p>
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
      <h2 className="font-serif text-2xl font-medium text-white">Menu</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onCategoryChange(null)}
          className={`cursor-pointer rounded-sm px-4 py-2 text-sm tracking-wide transition-colors duration-200
            ${!activeCategory
              ? "bg-amber-500 text-zinc-900"
              : "border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"}`}
        >
          Todos
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => onCategoryChange(cat.value)}
            className={`cursor-pointer rounded-sm px-4 py-2 text-sm tracking-wide transition-colors duration-200
              ${activeCategory === cat.value
                ? "bg-amber-500 text-zinc-900"
                : "border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="mt-6 text-zinc-500">Cargando menu...</p>}

      {error && <p className="mt-6 text-red-400">{error}</p>}

      {!isLoading && !error && items.length === 0 && (
        <p className="mt-6 text-zinc-500">No hay items disponibles.</p>
      )}

      {!isLoading && !error && items.length > 0 && (
        <div className="mt-6 space-y-8">
          {CATEGORIES.filter((cat) => groupedItems[cat.value]).map((cat) => (
            <section key={cat.value}>
              <h3 className="text-sm font-medium tracking-[0.2em] text-zinc-500 uppercase">
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
