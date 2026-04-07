import { useEffect, useState } from "react";
import type { MenuCategory, MenuItem } from "../types/api";
import * as menuService from "../services/menu.service";

const CATEGORIES: { value: MenuCategory; label: string }[] = [
  { value: "entrantes", label: "Entrantes" },
  { value: "principales", label: "Principales" },
  { value: "postres", label: "Postres" },
  { value: "bebidas", label: "Bebidas" },
];

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<MenuCategory | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    setError("");

    const category = activeCategory ?? undefined;
    menuService
      .getMenuItems(category)
      .then((response) => setItems(response.data))
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Error al cargar el menu";
        setError(message);
      })
      .finally(() => setIsLoading(false));
  }, [activeCategory]);

  const groupedItems = activeCategory
    ? { [activeCategory]: items }
    : items.reduce<Record<string, MenuItem[]>>((acc, item) => {
        const group = acc[item.category] ?? [];
        group.push(item);
        acc[item.category] = group;
        return acc;
      }, {});

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Nuestro menu</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
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
            onClick={() => setActiveCategory(cat.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors
              ${activeCategory === cat.value
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="mt-8 text-gray-500">Cargando menu...</p>}

      {error && <p className="mt-8 text-red-600">{error}</p>}

      {!isLoading && !error && items.length === 0 && (
        <p className="mt-8 text-gray-500">No hay items disponibles.</p>
      )}

      {!isLoading && !error && items.length > 0 && (
        <div className="mt-8 space-y-10">
          {CATEGORIES.filter((cat) => groupedItems[cat.value]).map((cat) => (
            <section key={cat.value}>
              <h2 className="text-xl font-semibold text-gray-800">
                {cat.label}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {groupedItems[cat.value].map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="mt-1 text-sm text-gray-500">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 font-semibold text-indigo-600">
                        ${item.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
