import { Link } from "@tanstack/react-router";
import { Moon, ShoppingBag, Sun, User, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-store";
import { useTheme } from "@/lib/theme";
import { supabase } from "@/integrations/supabase/client";

const baseLinks = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const count = useCart((s) => s.items.reduce((a, b) => a + b.quantity, 0));
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const check = async (userId: string | undefined) => {
      setIsAuthed(!!userId);
      if (!userId) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    };
    supabase.auth.getUser().then(({ data }) => check(data.user?.id));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      check(session?.user?.id),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const navLinks = [
    ...baseLinks,
    ...(isAuthed ? [] : [{ to: "/signup", label: "Sign up" }]),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 md:px-8">
        <Link to="/" className="text-display text-xl font-black tracking-tight">
          ZEVORIN
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-eyebrow text-foreground/70 transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/dashboard"
              className="text-eyebrow text-foreground/70 transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1">
          <button
            aria-label="Toggle theme"
            onClick={toggle}
            className="hidden h-10 w-10 items-center justify-center text-foreground/80 hover:text-foreground md:flex"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link
            to="/account"
            aria-label="Account"
            className="hidden h-10 w-10 items-center justify-center text-foreground/80 hover:text-foreground md:flex"
          >
            <User className="h-4 w-4" />
          </Link>
          <Link
            to="/cart"
            aria-label="Cart"
            className="relative flex h-10 w-10 items-center justify-center text-foreground/80 hover:text-foreground"
          >
            <ShoppingBag className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -right-0 -top-0 flex h-5 min-w-5 items-center justify-center bg-foreground px-1 text-[10px] font-semibold text-background">
                {count}
              </span>
            )}
          </Link>
          <button
            className="ml-1 flex h-10 w-10 items-center justify-center md:hidden"
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="flex flex-col px-5 py-4">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="border-b border-border py-3 text-sm font-medium"
              >
                {l.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="border-b border-border py-3 text-sm font-medium"
              >
                Dashboard
              </Link>
            )}
            <Link
              to="/account"
              onClick={() => setOpen(false)}
              className="border-b border-border py-3 text-sm font-medium"
            >
              Account
            </Link>
            <button
              onClick={() => {
                toggle();
                setOpen(false);
              }}
              className="py-3 text-left text-sm font-medium"
            >
              {theme === "dark" ? "Switch to light" : "Switch to dark"}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
