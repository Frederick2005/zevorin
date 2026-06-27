import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { Shell } from "@/components/layout/Shell";
import { productsQuery } from "@/lib/queries";
import { formatPrice } from "@/lib/cart-store";

const searchSchema = z.object({
  category: fallback(z.enum(["all", "men", "women", "kids", "unisex"]), "all").default("all"),
});

const FILTERS = [
  { key: "all", label: "All" },
  { key: "men", label: "Men" },
  { key: "women", label: "Women" },
  { key: "kids", label: "Kids" },
] as const;

export const Route = createFileRoute("/shop")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Shop — ZEVORIN" },
      { name: "description", content: "Shop monochrome editorial clothing across Men, Women, and Kids." },
    ],
  }),
  loaderDeps: ({ search }) => ({ category: search.category }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(productsQuery(deps.category)),
  errorComponent: ({ error }) => (
    <Shell><div className="p-12 text-sm text-muted-foreground">{error.message}</div></Shell>
  ),
  notFoundComponent: () => <Shell><div className="p-12">Not found.</div></Shell>,
  component: Shop,
});

function Shop() {
  const { category } = Route.useSearch();
  const { data: products } = useSuspenseQuery(productsQuery(category));

  return (
    <Shell>
      <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-8 md:py-16">
        <div className="flex flex-col items-start justify-between gap-6 border-b border-border pb-8 md:flex-row md:items-end">
          <div>
            <div className="text-eyebrow text-muted-foreground">Collection</div>
            <h1 className="text-display mt-2 text-4xl font-bold md:text-6xl">Shop</h1>
          </div>
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                to="/shop"
                search={{ category: f.key as "all" | "men" | "women" | "kids" }}
                className={[
                  "border px-4 py-2 text-eyebrow transition-colors",
                  category === f.key
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground",
                ].join(" ")}
              >
                {f.label}
              </Link>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="py-24 text-center text-sm text-muted-foreground">
            No pieces in this category yet.
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
            {products.map((p) => (
              <Link key={p.id} to="/product/$id" params={{ id: p.id }} className="group">
                <div className="aspect-[3/4] overflow-hidden bg-muted">
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-sm tabular-nums">{formatPrice(p.price)}</div>
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                  {p.category}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
