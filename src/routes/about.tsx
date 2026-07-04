import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Heart, Globe, Leaf, Quote, Instagram, Facebook, Twitter, Youtube, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — ZÉVORIN" },
      { name: "description", content: "The story behind ZÉVORIN: a Kampala‑based clothing atelier carrying the spirit of fashion and culture across the world." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <Shell>
      <div className="mx-auto max-w-4xl px-5 py-16 md:px-8 md:py-24">
        {/* Hero Section */}
        <section className="mb-20">
          <Badge className="mb-4 bg-black/5 text-black/60 dark:bg-white/10 dark:text-white/60 border-0">
            Est. 2024 • Kampala, Uganda
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            The Spirit of Fashion.
            <br />
            <span className="text-muted-foreground">The Soul of Uganda.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground/80 md:text-xl">
            ZÉVORIN isn't just clothing – it's a story. Born in the vibrant streets of Kampala, 
            crafted with passion, and carried across the world.
          </p>
        </section>

        {/* Our Story */}
        <section className="mb-20 border-t border-border pt-16">
          <div className="text-eyebrow text-muted-foreground">Our Story</div>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">
            Born in Kampala. Raised by Culture.
          </h2>
          <div className="mt-6 space-y-6 text-base leading-relaxed text-foreground/80 md:text-lg">
            <p>
              In the heart of Uganda, where rhythm meets creativity and tradition meets tomorrow, 
              <strong className="text-foreground"> ZÉVORIN</strong> was born. Not as just another 
              clothing brand – but as a movement. A movement to celebrate African fashion, honor 
              our heritage, and share the spirit of Uganda with the world.
            </p>
            <p>
              <strong className="text-foreground">Kayanja Micheal</strong>, founder and CEO, 
              saw a gap in the fashion world: a place where African culture could take center stage, 
              where every stitch tells a story, and where fashion becomes more than fabric – it 
              becomes identity.
            </p>
            <p>
              Together with co-founder <strong className="text-foreground">Magala Erica</strong>, 
              they built ZÉVORIN on a simple belief: fashion should empower, inspire, and connect.
            </p>
            <p>
              Today, ZÉVORIN is more than a brand. It's a family. A community. A global celebration 
              of culture, confidence, and creativity.
            </p>
          </div>
        </section>

        {/* Founders */}
        <section className="mb-20 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-border p-8 bg-card/50">
            <div className="text-eyebrow text-muted-foreground">Founder & CEO</div>
            <h3 className="mt-1 text-2xl font-bold">Kayanja Micheal</h3>
            <div className="mt-4 flex items-start gap-2">
              <Quote className="mt-1 h-5 w-5 shrink-0 text-muted-foreground/40" />
              <p className="text-sm italic text-muted-foreground/80">
                “Fashion is not what you wear – it's who you are. At ZÉVORIN, we dress the spirit.”
              </p>
            </div>
            <p className="mt-4 text-sm text-muted-foreground/70">
              Micheal's journey started with a dream: to put Ugandan fashion on the global map. 
              With relentless passion and an eye for detail, he built ZÉVORIN from the ground up – 
              a brand that stands for authenticity, quality, and cultural pride.
            </p>
          </div>

          <div className="rounded-2xl border border-border p-8 bg-card/50">
            <div className="text-eyebrow text-muted-foreground">Co-Founder & Creative Director</div>
            <h3 className="mt-1 text-2xl font-bold">Magala Erica</h3>
            <div className="mt-4 flex items-start gap-2">
              <Quote className="mt-1 h-5 w-5 shrink-0 text-muted-foreground/40" />
              <p className="text-sm italic text-muted-foreground/80">
                “Every stitch has purpose. Every design carries meaning.”
              </p>
            </div>
            <p className="mt-4 text-sm text-muted-foreground/70">
              Erica brings creativity, strategy, and soul to ZÉVORIN. Her dedication to design 
              and customer experience has shaped every piece we create – ensuring that when you 
              wear ZÉVORIN, you wear something special.
            </p>
          </div>
        </section>

        {/* The ZÉVORIN Promise */}
        <section className="mb-20 border-t border-border pt-16">
          <div className="text-eyebrow text-muted-foreground">Our Promise</div>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">
            What Makes Us Different
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="flex gap-4 rounded-xl border border-border p-6 bg-card/30">
              <Globe className="h-6 w-6 shrink-0 text-foreground/60" />
              <div>
                <h4 className="font-semibold">Authentically African</h4>
                <p className="text-sm text-muted-foreground/70">
                  Every design is inspired by the rich culture, colors, and stories of Uganda. 
                  We don't follow trends – we set them.
                </p>
              </div>
            </div>
            <div className="flex gap-4 rounded-xl border border-border p-6 bg-card/30">
              <Shield className="h-6 w-6 shrink-0 text-foreground/60" />
              <div>
                <h4 className="font-semibold">Uncompromising Quality</h4>
                <p className="text-sm text-muted-foreground/70">
                  From fabric to finish, we never cut corners. ZÉVORIN pieces are built to last, 
                  made with love, and crafted with pride.
                </p>
              </div>
            </div>
            <div className="flex gap-4 rounded-xl border border-border p-6 bg-card/30">
              <Heart className="h-6 w-6 shrink-0 text-foreground/60" />
              <div>
                <h4 className="font-semibold">Fashion for Everyone</h4>
                <p className="text-sm text-muted-foreground/70">
                  We believe fashion has no boundaries. Our collections celebrate diversity, 
                  individuality, and the unique beauty of every person.
                </p>
              </div>
            </div>
            <div className="flex gap-4 rounded-xl border border-border p-6 bg-card/30">
              <Leaf className="h-6 w-6 shrink-0 text-foreground/60" />
              <div>
                <h4 className="font-semibold">Sustainable & Ethical</h4>
                <p className="text-sm text-muted-foreground/70">
                  We care about our planet. From eco‑friendly materials to ethical production, 
                  we're committed to fashion that feels good – inside and out.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Community Quotes */}
        <section className="mb-20 border-t border-border pt-16">
          <div className="text-eyebrow text-muted-foreground">Our Community</div>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">
            Voices of ZÉVORIN
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-border p-6 bg-card/30">
              <Quote className="h-5 w-5 text-muted-foreground/40" />
              <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                “ZÉVORIN isn't just a brand – it's a feeling. Every piece tells a story.”
              </p>
              <p className="mt-2 text-xs text-muted-foreground/60">— A. N., Kampala</p>
            </div>
            <div className="rounded-xl border border-border p-6 bg-card/30">
              <Quote className="h-5 w-5 text-muted-foreground/40" />
              <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                “I've never felt more connected to my culture through fashion. ZÉVORIN makes me 
                proud to be Ugandan.”
              </p>
              <p className="mt-2 text-xs text-muted-foreground/60">— M. K., Entebbe</p>
            </div>
            <div className="rounded-xl border border-border p-6 bg-card/30">
              <Quote className="h-5 w-5 text-muted-foreground/40" />
              <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                “The quality is unmatched. I get compliments every time I wear ZÉVORIN.”
              </p>
              <p className="mt-2 text-xs text-muted-foreground/60">— S. O., Nairobi</p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="border-t border-border pt-16 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Join the Movement
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground/80">
            We're building something special, and we want you to be part of it. 
            Follow us, share your style, and help us carry the spirit of fashion 
            and culture to every corner of the world.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="gap-2">
              Shop the Collection <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
              Follow Us
            </Button>
          </div>
          <div className="mt-8 flex justify-center gap-4 text-muted-foreground/60">
            <a href="#" className="hover:text-foreground transition-colors"><Instagram className="h-6 w-6" /></a>
            <a href="#" className="hover:text-foreground transition-colors"><Facebook className="h-6 w-6" /></a>
            <a href="#" className="hover:text-foreground transition-colors"><Twitter className="h-6 w-6" /></a>
            <a href="#" className="hover:text-foreground transition-colors"><Youtube className="h-6 w-6" /></a>
          </div>
          <p className="mt-6 text-sm text-muted-foreground/60">
            <span className="font-semibold text-foreground">ZÉVORIN</span> – Carry the Spirit. Wear the Culture. 🖤
          </p>
        </section>
      </div>
    </Shell>
  );
}