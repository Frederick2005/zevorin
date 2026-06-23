import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-background">
      <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <div className="text-display text-2xl font-black">ZEVORIN</div>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Editorial monochrome. Clothing cut and finished in Kampala, Uganda.
            </p>
          </div>

          <div>
            <div className="text-eyebrow mb-4">Shop</div>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop" search={{ category: "men" }} className="hover:underline">Men</Link></li>
              <li><Link to="/shop" search={{ category: "women" }} className="hover:underline">Women</Link></li>
              <li><Link to="/shop" search={{ category: "kids" }} className="hover:underline">Kids</Link></li>
              <li><Link to="/shop" className="hover:underline">All</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-eyebrow mb-4">Atelier</div>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:underline">About</Link></li>
              <li><Link to="/contact" className="hover:underline">Contact</Link></li>
              <li><Link to="/faqs" className="hover:underline">FAQs</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-eyebrow mb-4">Legal</div>
            <ul className="space-y-2 text-sm">
              <li><Link to="/legal" hash="privacy" className="hover:underline">Privacy</Link></li>
              <li><Link to="/legal" hash="terms" className="hover:underline">Terms</Link></li>
              <li><Link to="/legal" hash="returns" className="hover:underline">Returns</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-8 text-xs text-muted-foreground md:flex-row md:items-center">
          <div>© {new Date().getFullYear()} Zevorin Atelier. All rights reserved.</div>
          <div>Kampala · Entebbe · Jinja</div>
        </div>
      </div>
    </footer>
  );
}
