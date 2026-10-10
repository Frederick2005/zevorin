import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { formatPrice, useCart } from "@/lib/cart-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createCheckout } from "@/lib/payments.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — ZÉVORIN" }] }),
  component: Checkout,
});

function Checkout() {
  const items = useCart((s) => s.items);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const [form, setForm] = useState({
    email: "",
    fullName: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  if (items.length === 0) {
    return (
      <Shell>
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <h1 className="text-display text-3xl font-bold">Your bag is empty</h1>
          <Link to="/shop" className="text-eyebrow mt-6 inline-block underline">
            Shop the collection
          </Link>
        </div>
      </Shell>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.fullName || !form.phone || !form.address) {
      toast.error("Please complete all fields");
      return;
    }
    if (loading) return; // block double submits
    setLoading(true);
    try {
      // Signed-in customers: attach the session so the order is theirs.
      // The server verifies the token; guests simply send no token.
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await createCheckout({
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        data: {
          // Only the customer's choices are sent. Prices and totals are
          // calculated on the server from the database.
          items: items.map((i) => ({
            productId: i.type === "clothing" ? i.productId : undefined,
            showId: i.type === "ticket" ? i.showId : undefined,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
          })),
          customer: {
            email: form.email,
            name: form.fullName,
            phone: form.phone.replace(/[\s-]/g, ""),
            address: form.address,
          },
        },
      });
      // The bag is NOT cleared here: it is cleared only once payment is verified.
      window.location.href = res.link;
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : "We couldn't start your payment. Please try again.",
      );
      setLoading(false);
    }
  };

  const input =
    "w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground";

  return (
    <Shell>
      <div className="mx-auto grid max-w-[1200px] gap-12 px-5 py-12 md:grid-cols-[1fr_380px] md:px-8 md:py-16">
        <form onSubmit={submit} className="space-y-10">
          <div>
            <h1 className="text-display text-3xl font-bold md:text-5xl">
              Checkout
            </h1>
            <div className="text-eyebrow mt-2 text-muted-foreground">
              Guest checkout enabled
            </div>
          </div>

          <section>
            <div className="text-eyebrow mb-4">Contact</div>
            <div className="grid gap-3">
              <input
                type="email"
                placeholder="Email"
                className={input}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                placeholder="Full name"
                className={input}
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
              <input
                placeholder="Phone (for Mobile Money)"
                className={input}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </section>

          <section>
            <div className="text-eyebrow mb-4">Delivery</div>
            <textarea
              placeholder="Address"
              rows={3}
              className={input}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </section>

          <section>
            <div className="text-eyebrow mb-4">Payment</div>
            <div className="border border-foreground bg-foreground p-4 text-background">
              <div className="text-sm font-semibold">Mobile Money</div>
              <div className="mt-1 text-xs opacity-80">
                MTN Mobile Money, Airtel Money — via Flutterwave (UGX)
              </div>
            </div>
          </section>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-foreground py-4 text-eyebrow text-background hover:bg-foreground/85 disabled:opacity-50"
          >
            {loading
              ? "Redirecting to payment…"
              : `Pay ${formatPrice(subtotal)}`}
          </button>
        </form>

        <aside className="h-fit border border-border p-6">
          <div className="text-eyebrow mb-4">Order</div>
          <ul className="space-y-4">
            {items.map((i) => (
              <li key={i.lineId} className="flex gap-3">
                {i.image && (
                  <div className="h-16 w-16 shrink-0 overflow-hidden bg-muted">
                    <img
                      src={i.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 text-xs">
                  <div className="font-medium">{i.name}</div>
                  <div className="text-muted-foreground">
                    Qty {i.quantity}
                    {i.size ? ` · ${i.size}` : ""}
                    {i.color ? ` · ${i.color}` : ""}
                  </div>
                </div>
                <div className="text-xs tabular-nums">
                  {formatPrice(i.price * i.quantity)}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-between border-t border-border pt-4 text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatPrice(subtotal)}</span>
          </div>
        </aside>
      </div>
    </Shell>
  );
}
