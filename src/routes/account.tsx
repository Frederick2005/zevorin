import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { Shell } from "@/components/layout/Shell";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/cart-store";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

const search = z.object({
  order: fallback(z.string().optional(), undefined),
});

export const Route = createFileRoute("/account")({
  validateSearch: zodValidator(search),
  head: () => ({ meta: [{ title: "Account — ZÉVORIN" }] }),
  component: Account,
});

type Order = {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  customer_name: string;
  items: Array<{ name: string; quantity: number }>;
};

function Account() {
  const { order } = Route.useSearch();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: "", password: "" });
  const [orders, setOrders] = useState<Order[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("id, total_amount, status, created_at, customer_name, items")
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data as unknown as Order[]) ?? []));
  }, [user]);

  useEffect(() => {
    if (order) toast.success(`Order ${order.slice(0, 8)} placed.`);
  }, [order]);

  if (loading)
    return (
      <Shell>
        <div className="p-12 text-sm text-muted-foreground">Loading…</div>
      </Shell>
    );

  if (!user) {
    const submit = async (e: React.FormEvent) => {
      e.preventDefault();
      const { data, error } = await supabase.auth.signInWithPassword(form);
      if (error) {
        toast.error(error.message);
        return;
      }
      const uid = data.user?.id;
      if (!uid) {
        toast.success("Signed in");
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      const isAdmin = (roles ?? []).some((r) => r.role === "admin");
      toast.success("Signed in");
      navigate({ to: isAdmin ? "/dashboard" : "/" });
    };

    const input =
      "w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground";

    return (
      <Shell>
        <div className="mx-auto grid max-w-[1100px] gap-12 px-5 py-16 md:grid-cols-2 md:px-8 md:py-24">
          <div>
            <h1 className="text-display text-4xl font-bold md:text-6xl">
              Sign in
            </h1>
            <p className="mt-6 max-w-sm text-sm text-muted-foreground">
              Sign in to track your orders and check out faster.
            </p>
          </div>
          <form
            onSubmit={submit}
            className="space-y-4 border border-border p-8"
          >
            <div className="text-eyebrow border-b border-border pb-3">
              Sign in
            </div>
            <input
              type="email"
              placeholder="Email"
              className={input}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              className={input}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button className="w-full bg-foreground py-3 text-eyebrow text-background hover:bg-foreground/85">
              Sign in
            </button>
          </form>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-[1100px] px-5 py-12 md:px-8 md:py-16">
        <div className="flex items-end justify-between border-b border-border pb-8">
          <div>
            <div className="text-eyebrow text-muted-foreground">Account</div>
            <h1 className="text-display mt-2 text-3xl font-bold md:text-5xl">
              {user.email}
            </h1>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/" });
            }}
            className="text-eyebrow underline-offset-4 hover:underline"
          >
            Sign out
          </button>
        </div>

        <div className="mt-10">
          <div className="text-eyebrow mb-4">Order history</div>
          {orders.length === 0 ? (
            <div className="border border-border py-16 text-center text-sm text-muted-foreground">
              No orders yet
            </div>
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {orders.map((o) => (
                <li key={o.id} className="grid grid-cols-12 gap-4 py-4 text-sm">
                  <div className="col-span-3 tabular-nums text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString("en-GB")}
                  </div>
                  <div className="col-span-5 truncate">
                    {o.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}
                  </div>
                  <div className="col-span-2 text-eyebrow uppercase">
                    {o.status}
                  </div>
                  <div className="col-span-2 text-right tabular-nums">
                    {formatPrice(Number(o.total_amount))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Shell>
  );
}
