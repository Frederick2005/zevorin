import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — ZÉVORIN" },
      { name: "description", content: "Reach the ZÉVORIN atelier." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill all fields");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("contact_messages").insert(form);
    setSending(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Message sent");
      setForm({ name: "", email: "", message: "" });
    }
  };

  const input =
    "w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground";

  return (
    <Shell>
      <div className="mx-auto grid max-w-[1100px] gap-12 px-5 py-16 md:grid-cols-2 md:px-8 md:py-24">
        <div>
          <div className="text-eyebrow text-muted-foreground">Atelier</div>
          <h1 className="text-display mt-2 text-4xl font-bold md:text-6xl">Contact</h1>
          <div className="mt-10 space-y-6 text-sm">
            <div>
              <div className="text-eyebrow mb-1">Studio</div>
              <div>Plot 14 Kyaggwe Road, Nakasero, Kampala, Uganda</div>
            </div>
            <div>
              <div className="text-eyebrow mb-1">Email</div>
              <a href="mailto:atelier@zévorin.ug" className="hover:underline">atelier@zévorin.ug</a>
            </div>
            <div>
              <div className="text-eyebrow mb-1">Press</div>
              <a href="mailto:press@zévorin.ug" className="hover:underline">press@zévorin.ug</a>
            </div>
            <div>
              <div className="text-eyebrow mb-1">Phone</div>
              <a href="tel:+256700000000" className="hover:underline">+256 700 000 000</a>
            </div>
            <div>
              <div className="text-eyebrow mb-1">Hours</div>
              <div>Tue – Sat · 10:00 – 18:00 EAT</div>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3 border border-border p-6 md:p-8">
          <div className="text-eyebrow mb-2">Write to us</div>
          <input placeholder="Name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
          <input type="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} />
          <textarea rows={6} placeholder="Message" value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })} className={input} />
          <button disabled={sending}
            className="w-full bg-foreground py-3 text-eyebrow text-background hover:bg-foreground/85 disabled:opacity-50">
            {sending ? "Sending…" : "Send message"}
          </button>
        </form>
      </div>
    </Shell>
  );
}
