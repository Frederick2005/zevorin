import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/layout/Shell";
import { formatPrice, useCart } from "@/lib/cart-store";
import { Minus, Plus, X } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Bag — ZEVORIN" }] }),
  component: CartPage,
});

function CartPage() {
  const items = useCart((s) => s.items);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <Shell>
      <div className="mx-auto max-w-[1200px] px-5 py-12 md:px-8 md:py-16">
        <h1 className="text-display text-4xl font-bold md:text-6xl">Bag</h1>

        {items.length === 0 ? (
          <div className="mt-16 border border-border py-24 text-center">
            <div className="text-eyebrow text-muted-foreground">Your bag is empty</div>
            <Link to="/shop" className="mt-6 inline-block bg-foreground px-6 py-3 text-eyebrow text-background">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-3">
            <ul className="lg:col-span-2">
              {items.map((i) => (
                <li
                  key={i.lineId}
                  className="grid grid-cols-[88px_1fr_auto] gap-4 border-b border-border py-6 md:grid-cols-[120px_1fr_auto_auto]"
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    {i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div>
                    <div className="text-eyebrow text-muted-foreground">
                      {i.type === "ticket" ? "Ticket" : "Apparel"}
                    </div>
                    <div className="mt-1 text-sm font-medium md:text-base">{i.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {i.meta}
                      {i.size && <>Size {i.size}</>}
                      {i.size && i.color && <> · </>}
                      {i.color && <>{i.color}</>}
                    </div>
                    <div className="mt-3 inline-flex items-center border border-border">
                      <button aria-label="Decrease" onClick={() => updateQuantity(i.lineId, i.quantity - 1)} className="p-2">
                        <Minus className="h-3 w-3" />
                      </button>
                      <div className="w-8 text-center text-sm tabular-nums">{i.quantity}</div>
                      <button aria-label="Increase" onClick={() => updateQuantity(i.lineId, i.quantity + 1)} className="p-2">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="hidden text-right text-sm tabular-nums md:block">
                    {formatPrice(i.price * i.quantity)}
                  </div>
                  <button
                    aria-label="Remove"
                    onClick={() => removeItem(i.lineId)}
                    className="self-start p-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>

            <aside className="h-fit border border-border p-6">
              <div className="text-eyebrow mb-4">Order summary</div>
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="mt-6 flex justify-between border-t border-border pt-4 text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <Link to="/checkout" className="mt-6 block w-full bg-foreground py-3 text-center text-eyebrow text-background hover:bg-foreground/85">
                Proceed to checkout
              </Link>
              <div className="mt-3 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
                Pay with Mobile Money
              </div>
            </aside>
          </div>
        )}
      </div>
    </Shell>
  );
}
