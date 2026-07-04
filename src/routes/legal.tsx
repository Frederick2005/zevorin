import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/layout/Shell";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Legal — ZÉVORIN" },
      { name: "description", content: "Privacy Policy, Terms of Service, and Returns Policy." },
    ],
  }),
  component: Legal,
});

const tabs = [
  { key: "privacy", label: "Privacy" },
  { key: "terms", label: "Terms" },
  { key: "returns", label: "Returns" },
] as const;

function Legal() {
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("privacy");

  return (
    <Shell>
      <div className="mx-auto max-w-[1000px] px-5 py-16 md:px-8 md:py-24">
        <div className="text-eyebrow text-muted-foreground">Legal</div>
        <h1 className="text-display mt-2 text-4xl font-bold md:text-6xl">Policies</h1>

        <div className="mt-10 flex gap-1 border-b border-border">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={[
                "px-5 py-3 text-eyebrow",
                tab === t.key
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-10 max-w-none text-sm leading-relaxed text-foreground/85">
          {tab === "privacy" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Privacy Policy</h2>
              <p>We collect only the information needed to fulfill your orders: name, email, phone, and shipping address. We never sell your data.</p>
              <p>Payment information is handled directly by Flutterwave and never stored on our servers. Authentication is provided by our backend, which keeps your account details encrypted at rest.</p>
              <p>You may request deletion of your account and personal data at any time by emailing atelier@zévorin.ug.</p>
            </div>
          )}
          {tab === "terms" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Terms of Service</h2>
              <p>By placing an order on this site, you agree to these terms. Prices are listed in Uganda Shillings (UGX) and include VAT where applicable.</p>
              <p>All ZÉVORIN artwork, imagery, and product designs are the property of ZÉVORIN Atelier, Kampala. Personal use of imagery is welcome with credit; commercial use requires written permission.</p>
              <p>Disputes are governed by the laws of the Republic of Uganda.</p>
            </div>
          )}
          {tab === "returns" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Returns &amp; Refunds</h2>
              <p>Unworn, unwashed clothing items with original tags may be returned within 14 days of delivery. Refunds are issued to the original Mobile Money number or card.</p>
              <p>Sale items are final. Custom-made pieces are non-returnable.</p>
              <p>Drop off returns at our Nakasero studio or arrange a SafeBoda pickup by emailing atelier@zévorin.ug.</p>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
