import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { Plus, Minus } from "lucide-react";

export const Route = createFileRoute("/faqs")({
  head: () => ({
    meta: [
      { title: "FAQs — ZÉVORIN" },
      {
        name: "description",
        content:
          "Frequently asked questions about ZÉVORIN orders, shipping, returns, and tickets.",
      },
    ],
  }),
  component: FAQs,
});

const faqs = [
  {
    q: "How long does shipping take?",
    a: "Orders within Greater Kampala ship in 1–2 business days. Rest of Uganda 3–5 days via SafeBoda or Post Bus. East African Community deliveries 5–10 days via DHL.",
  },
  {
    q: "What is the return policy?",
    a: "Unworn, unwashed items with tags attached can be returned within 14 days of delivery for a full refund. Sale items are final.",
  },
  {
    q: "Which Mobile Money networks are supported?",
    a: "MTN Mobile Money and Airtel Money via our Flutterwave checkout. Visa and Mastercard are also accepted.",
  },
  {
    q: "How do I know my size?",
    a: "Each product page lists detailed measurements in centimeters. When between sizes we recommend sizing up for our relaxed silhouettes.",
  },
  {
    q: "Do you restock sold-out pieces?",
    a: "Most pieces are produced in a single, limited run from our Nakasero studio. We occasionally re-cut foundation pieces — join the list on the homepage to be notified.",
  },
  {
    q: "Do you ship outside Uganda?",
    a: "Yes — we ship across Kenya, Rwanda, Tanzania, and South Sudan via DHL Express. Contact us for rates to other countries.",
  },
];

function FAQs() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Shell>
      <div className="mx-auto max-w-[900px] px-5 py-16 md:px-8 md:py-24">
        <div className="text-eyebrow text-muted-foreground">Help</div>
        <h1 className="text-display mt-2 text-4xl font-bold md:text-6xl">
          FAQs
        </h1>

        <ul className="mt-12 border-y border-border">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={f.q} className="border-b border-border last:border-b-0">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between py-5 text-left"
                >
                  <span className="text-base font-medium md:text-lg">
                    {f.q}
                  </span>
                  {isOpen ? (
                    <Minus className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </button>
                {isOpen && (
                  <div className="pb-6 pr-8 text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </Shell>
  );
}
