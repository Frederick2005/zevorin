import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { productByIdQuery } from "@/lib/queries";
import { formatPrice, useCart } from "@/lib/cart-store";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$id")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(productByIdQuery(params.id));
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Product"} — ZEVORIN` },
      { name: "description", content: loaderData?.description ?? "Zevorin product" },
      { property: "og:title", content: `${loaderData?.name ?? "Product"} — ZEVORIN` },
      { property: "og:description", content: loaderData?.description ?? "" },
      ...(loaderData?.images?.[0] ? [{ property: "og:image", content: loaderData.images[0] }] : []),
    ],
  }),
  errorComponent: ({ error }) => (
    <Shell><div className="p-12 text-sm text-muted-foreground">{error.message}</div></Shell>
  ),
  notFoundComponent: () => (
    <Shell>
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="text-display text-3xl font-bold">Piece not found</h1>
        <Link to="/shop" className="text-eyebrow mt-6 inline-block underline">
          Back to shop
        </Link>
      </div>
    </Shell>
  ),
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const { data: product } = useSuspenseQuery(productByIdQuery(id));
  const navigate = useNavigate();
  const addItem = useCart((s) => s.addItem);

  const [size, setSize] = useState(product?.sizes?.[0] ?? "");
  const [color, setColor] = useState(product?.colors?.[0] ?? "");
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  if (!product) return null;

  const addToCart = () => {
    if (product.sizes.length > 0 && !size) {
      toast.error("Select a size");
      return;
    }
    addItem({
      lineId: `${product.id}::${size}::${color}`,
      type: "clothing",
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      size,
      color,
      quantity: qty,
    });
    toast.success("Added to bag");
  };

  return (
    <Shell>
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-10 md:grid-cols-2 md:gap-16 md:px-8 md:py-16">
        <div>
          <div className="aspect-[3/4] overflow-hidden bg-muted">
            <img
              src={product.images[activeImg]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setActiveImg(i)}
                  className={[
                    "aspect-square overflow-hidden border bg-muted",
                    i === activeImg ? "border-foreground" : "border-border",
                  ].join(" ")}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-eyebrow text-muted-foreground">{product.category}</div>
          <h1 className="text-display mt-2 text-3xl font-bold md:text-5xl">{product.name}</h1>
          <div className="mt-4 text-xl tabular-nums">{formatPrice(product.price)}</div>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          {product.sizes.length > 0 && (
            <div className="mt-10">
              <div className="text-eyebrow mb-3">Size</div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={[
                      "min-w-12 border px-4 py-2 text-sm",
                      size === s
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground",
                    ].join(" ")}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors.length > 0 && (
            <div className="mt-6">
              <div className="text-eyebrow mb-3">Color</div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={[
                      "border px-4 py-2 text-sm",
                      color === c
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground",
                    ].join(" ")}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <div className="text-eyebrow mb-3">Quantity</div>
            <div className="inline-flex items-center border border-border">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-2">−</button>
              <div className="w-10 text-center tabular-nums">{qty}</div>
              <button onClick={() => setQty((q) => q + 1)} className="px-4 py-2">+</button>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={addToCart}
              className="flex-1 bg-foreground px-8 py-4 text-eyebrow text-background hover:bg-foreground/85"
            >
              Add to bag
            </button>
            <button
              onClick={() => { addToCart(); navigate({ to: "/cart" }); }}
              className="flex-1 border border-foreground px-8 py-4 text-eyebrow hover:bg-foreground hover:text-background"
            >
              Buy now
            </button>
          </div>

          <div className="mt-10 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
            Free shipping over GHS 500 · 14-day returns · Ships within 48h
          </div>
        </div>
      </div>
    </Shell>
  );
}
