import { useEffect, useState } from "react";
import { MenuItemSkeleton } from "../components/Skeleton";
import { useToast } from "../context/ToastContext";
import type { MenuCategory, MenuItem } from "../types/api";
import * as menuService from "../services/menu.service";

const CATEGORIES: { value: MenuCategory; label: string }[] = [
  { value: "entrantes", label: "Entrantes" },
  { value: "principales", label: "Principales" },
  { value: "postres", label: "Postres" },
  { value: "bebidas", label: "Bebidas" },
];

const FEATURED_COUNT = 2;

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<MenuCategory | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const toast = useToast();

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
        toast.error(message);
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

  const isFeatured = !activeCategory;

  function renderMenuItem(item: MenuItem) {
    return (
      <div key={item.id} className="group py-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-medium text-zinc-200 transition-colors duration-200 group-hover:text-amber-500">
            {item.name}
          </h3>
          <span className="min-w-8 flex-1 border-b border-dotted border-zinc-700" />
          <span className="shrink-0 font-medium text-amber-500">
            ${item.price}
          </span>
        </div>
        {item.description && (
          <p className="mt-1 text-sm leading-relaxed text-zinc-500 italic">
            {item.description}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 animate-fade-in-up">
      <div className="text-center">
        <p className="text-xs font-medium tracking-[0.3em] text-amber-500 uppercase">
          Seleccion del chef
        </p>
        <h1 className="mt-3 font-serif text-5xl font-medium text-white">
          Nuestro Menu
        </h1>
        <div className="mx-auto mt-4 h-px w-16 bg-amber-500" />
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className={`cursor-pointer rounded-sm px-4 py-2 text-sm tracking-wide transition-colors duration-200
            ${!activeCategory
              ? "bg-amber-500 text-zinc-900"
              : "border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"}`}
        >
          Destacados
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setActiveCategory(cat.value)}
            className={`cursor-pointer rounded-sm px-4 py-2 text-sm tracking-wide transition-colors duration-200
              ${activeCategory === cat.value
                ? "bg-amber-500 text-zinc-900"
                : "border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="mt-12 border border-zinc-800 bg-zinc-800 px-8 py-10 shadow-lg animate-fade-in sm:px-14 sm:py-14">
          {CATEGORIES.map((cat) => (
            <div key={cat.value} className="mb-8 last:mb-0">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-zinc-700" />
                <div className="h-4 w-24 rounded-sm bg-zinc-700 animate-pulse-soft" />
                <div className="h-px flex-1 bg-zinc-700" />
              </div>
              <div className="mt-5">
                <MenuItemSkeleton />
                <MenuItemSkeleton />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && error && <p className="mt-12 text-center text-zinc-500">No se pudo cargar el menu.</p>}

      {!isLoading && !error && items.length === 0 && (
        <p className="mt-12 text-center text-zinc-500">No hay items disponibles.</p>
      )}

      {!isLoading && !error && items.length > 0 && (
        <div className="mt-12 border border-zinc-800 bg-zinc-800 px-8 py-10 shadow-lg animate-fade-in-up sm:px-14 sm:py-14">
          <div className="space-y-12">
            {CATEGORIES.filter((cat) => groupedItems[cat.value]).map((cat) => {
              const categoryItems = groupedItems[cat.value];
              const visibleItems = isFeatured
                ? categoryItems.slice(0, FEATURED_COUNT)
                : categoryItems;
              const hasMore = isFeatured && categoryItems.length > FEATURED_COUNT;

              return (
                <section key={cat.value}>
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-zinc-700" />
                    <h2 className="font-serif text-lg font-medium tracking-wide text-zinc-300">
                      {cat.label}
                    </h2>
                    <div className="h-px flex-1 bg-zinc-700" />
                  </div>

                  <div className="mt-5 space-y-1">
                    {visibleItems.map(renderMenuItem)}
                  </div>

                  {hasMore && (
                    <button
                      type="button"
                      onClick={() => setActiveCategory(cat.value)}
                      className="mt-3 cursor-pointer text-sm font-medium text-amber-500 transition-colors duration-200 hover:text-amber-400"
                    >
                      Ver {cat.label.toLowerCase()} completo &rarr;
                    </button>
                  )}
                </section>
              );
            })}
          </div>

          <div className="mt-10 flex justify-center">
            <div className="h-px w-16 bg-amber-500" />
          </div>
        </div>
      )}
    </div>
  );
}
