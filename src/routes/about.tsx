import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/layout/Shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — ZEVORIN" },
      { name: "description", content: "The story behind Zevorin: editorial monochrome clothing tailored in Kampala, Uganda." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <Shell>
      <div className="mx-auto max-w-[900px] px-5 py-16 md:px-8 md:py-24">
        <div className="text-eyebrow text-muted-foreground">Atelier</div>
        <h1 className="text-display mt-2 text-4xl font-bold md:text-7xl">
          Negative space, on the body.
        </h1>

        <div className="mt-12 space-y-6 text-base leading-relaxed text-foreground/80 md:text-lg">
          <p>
            ZEVORIN is a clothing atelier founded in Kampala in 2024.
            We design within a strict monochrome palette — black, white, and the grays between —
            because constraint clarifies.
          </p>
          <p>
            Every garment begins as a single line drawing. We resist embellishment, color, and
            seasonal noise. Our seasons exist for one reason only: to give the wearer a longer
            relationship with each piece.
          </p>
          <p>
            Pieces are cut and finished in our Nakasero studio by a small team of Ugandan tailors.
            We ship across Uganda and the wider East African region.
          </p>
        </div>

        <div className="mt-16 grid gap-6 border-t border-border pt-12 md:grid-cols-3">
          <div>
            <div className="text-display text-3xl font-bold">12</div>
            <div className="text-eyebrow mt-1 text-muted-foreground">Looks per season</div>
          </div>
          <div>
            <div className="text-display text-3xl font-bold">100%</div>
            <div className="text-eyebrow mt-1 text-muted-foreground">Made in Uganda</div>
          </div>
          <div>
            <div className="text-display text-3xl font-bold">∞</div>
            <div className="text-eyebrow mt-1 text-muted-foreground">Shades of gray</div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
