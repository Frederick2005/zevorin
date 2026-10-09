import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Shell } from "@/components/layout/Shell";
import { featuredProductsQuery } from "@/lib/queries";
import { formatPrice } from "@/lib/cart-store";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ZÉVORIN — Monochrome Clothing from Kampala, Uganda" },
      {
        name: "description",
        content:
          "Editorial monochrome clothing, designed and tailored in Kampala. Shop the ZÉVORIN collection across Uganda.",
      },
      { property: "og:title", content: "ZÉVORIN" },
      {
        property: "og:description",
        content: "Editorial monochrome clothing from Kampala, Uganda.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(featuredProductsQuery());
  },
  errorComponent: ({ error }) => (
    <Shell>
      <div className="p-12 text-sm text-muted-foreground">{error.message}</div>
    </Shell>
  ),
  notFoundComponent: () => (
    <Shell>
      <div className="p-12">Not found.</div>
    </Shell>
  ),
  component: Index,
});

function Index() {
  const { data: featured } = useSuspenseQuery(featuredProductsQuery());

  return (
    <Shell>
      {/* HERO */}
      <section className="relative border-b border-border">
        <div className="mx-auto grid max-w-[1400px] gap-0 px-0 md:grid-cols-12">
          <div className="flex flex-col justify-between px-5 py-16 md:col-span-5 md:px-12 md:py-24">
            <div className="text-eyebrow">SS27 — Volume 01 · Kampala</div>
            <h1 className="text-display mt-10 text-[14vw] font-black leading-[0.85] md:mt-16 md:text-[6.5rem]">
              ZÉVORIN
            </h1>
            <div className="mt-10 max-w-sm text-sm text-muted-foreground md:mt-16">
              A monochrome study in negative space — clothing cut, sewn and
              finished in Kampala for everyday wear across Uganda.
            </div>
            <div className="mt-8 flex gap-3">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-foreground px-6 py-3 text-eyebrow text-background transition-colors hover:bg-foreground/85"
              >
                Shop collection <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 border border-foreground px-6 py-3 text-eyebrow hover:bg-foreground hover:text-background"
              >
                Our atelier
              </Link>
            </div>
          </div>
          <div className="relative h-[60vh] md:col-span-7 md:h-auto md:min-h-[640px]">
            <img
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1800&q=85"
              alt="Editorial monochrome look"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute bottom-4 right-4 text-[10px] tracking-widest text-background mix-blend-difference">
              LOOK 01 · BONE SILK
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 md:px-8 md:py-28">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="text-eyebrow text-muted-foreground">Featured</div>
            <h2 className="text-display mt-2 text-3xl font-bold md:text-5xl">
              The Collection
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-eyebrow underline-offset-4 hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
          {featured.map((p) => (
            <Link
              key={p.id}
              to="/product/$id"
              params={{ id: p.id }}
              className="group"
            >
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
                <div className="text-sm tabular-nums">
                  {formatPrice(p.price)}
                </div>
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                {p.category}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Shell>
  );
}
