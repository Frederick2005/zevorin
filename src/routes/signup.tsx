import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create Account — ZEVORIN" },
      { name: "description", content: "Join Zevorin. Monochrome fashion from Kampala." },
    ],
  }),
  component: SignupPage,
});

const COUNTRY_CODES = [
  { code: "+256", label: "🇺🇬 +256" },
  { code: "+254", label: "🇰🇪 +254" },
  { code: "+255", label: "🇹🇿 +255" },
  { code: "+250", label: "🇷🇼 +250" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+44", label: "🇬🇧 +44" },
];

function scorePassword(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return Math.min(s, 4);
}

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dialCode, setDialCode] = useState("+256");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [agreeError, setAgreeError] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 2) e.fullName = "Enter your full name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Valid email required";
    if (!/^\d{7,12}$/.test(phone)) e.phone = "Valid phone number required";
    if (password.length < 8) e.password = "Minimum 8 characters";
    return e;
  }, [fullName, email, phone, password]);

  const pwScore = scorePassword(password);
  const pwLabel = ["", "Weak", "Weak", "Medium", "Strong"][pwScore];

  const inputBase =
    "w-full border bg-background px-4 py-3 text-sm outline-none transition-colors";
  const inputCls = (key: string) =>
    `${inputBase} ${touched[key] && errors[key] ? "border-red-600 focus:border-red-600" : "border-border focus:border-foreground"}`;

  const onBlur = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ fullName: true, email: true, phone: true, password: true });
    setAgreeError(!agree);
    if (Object.keys(errors).length > 0 || !agree) return;

    setSubmitting(true);
    setFormError(null);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + "/shop",
          data: {
            full_name: fullName.trim(),
            phone_number: `${dialCode}${phone}`,
            marketing_opt_in: marketing,
          },
        },
      });
      if (error) {
        setFormError(error.message);
        return;
      }
      toast.success("Welcome to Zevorin");
      navigate({ to: "/shop" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/shop",
    });
    if (result.error) {
      toast.error("Google sign-in failed");
    }
  };

  return (
    <Shell>
      <div className="grid min-h-[calc(100dvh-4rem)] grid-cols-1 md:grid-cols-5">
        {/* Hero */}
        <aside className="relative hidden md:col-span-3 md:block">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80"
            alt="Zevorin editorial"
            className="absolute inset-0 h-full w-full object-cover grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/50 to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
            <div className="text-display text-2xl font-black tracking-tight">ZEVORIN</div>
            <div>
              <h2 className="text-display text-5xl font-bold leading-[0.95] lg:text-7xl">
                Where Style<br />Meets Art.
              </h2>
              <p className="mt-6 max-w-md text-sm text-white/70">
                Kampala-made monochrome essentials. Join the atelier.
              </p>
            </div>
          </div>
        </aside>

        {/* Form */}
        <section className="md:col-span-2 flex items-center justify-center px-5 py-12 md:px-10 md:py-16">
          <div className="w-full max-w-md">
            <div className="text-eyebrow text-muted-foreground">Create account</div>
            <h1 className="text-display mt-2 text-3xl font-bold md:text-4xl">
              Join Zevorin
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/account" className="underline underline-offset-4 hover:no-underline">
                Sign in
              </Link>
            </p>

            {formError && (
              <div
                role="alert"
                className="mt-6 border border-foreground/30 bg-foreground/[0.04] px-4 py-3 text-sm"
              >
                {formError}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogle}
              className="mt-8 flex w-full items-center justify-center gap-3 border border-foreground bg-background px-4 py-3 text-eyebrow text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              <GoogleMark />
              Sign up with Google
            </button>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-eyebrow text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={submit} noValidate className="space-y-5">
              <Field
                label="Full Name"
                htmlFor="fullName"
                error={touched.fullName ? errors.fullName : undefined}
              >
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g., John Doe"
                  className={inputCls("fullName")}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={() => onBlur("fullName")}
                  aria-describedby="fullName-err"
                  disabled={submitting}
                />
              </Field>

              <Field
                label="Email Address"
                htmlFor="email"
                error={touched.email ? errors.email : undefined}
              >
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={inputCls("email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => onBlur("email")}
                  aria-describedby="email-err"
                  disabled={submitting}
                />
              </Field>

              <Field
                label="Phone Number"
                htmlFor="phone"
                error={touched.phone ? errors.phone : undefined}
              >
                <div
                  className={`flex border ${touched.phone && errors.phone ? "border-red-600" : "border-border focus-within:border-foreground"}`}
                >
                  <select
                    aria-label="Country code"
                    value={dialCode}
                    onChange={(e) => setDialCode(e.target.value)}
                    className="border-r border-border bg-background px-3 text-sm outline-none"
                    disabled={submitting}
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel-national"
                    placeholder="772 123 456"
                    className="w-full bg-background px-4 py-3 text-sm outline-none"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
                    onBlur={() => onBlur("phone")}
                    aria-describedby="phone-err"
                    disabled={submitting}
                  />
                </div>
              </Field>

              <Field
                label="Password"
                htmlFor="password"
                error={touched.password ? errors.password : undefined}
              >
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    className={`${inputCls("password")} pr-12`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => onBlur("password")}
                    aria-describedby="password-err password-strength"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-foreground/70 hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && (
                  <div id="password-strength" className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 ${i <= pwScore ? "bg-foreground" : "bg-border"}`}
                        />
                      ))}
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                      {pwLabel}
                    </div>
                  </div>
                )}
              </Field>

              <div className="space-y-3 pt-2">
                <label className={`flex cursor-pointer items-start gap-3 text-sm ${agreeError ? "text-red-600" : ""}`}>
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => {
                      setAgree(e.target.checked);
                      if (e.target.checked) setAgreeError(false);
                    }}
                    className={`mt-0.5 h-4 w-4 accent-foreground ${agreeError ? "outline outline-1 outline-red-600" : ""}`}
                    disabled={submitting}
                  />
                  <span>
                    I agree to the{" "}
                    <Link to="/legal" className="underline underline-offset-2">
                      Terms of Service and Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-foreground"
                    disabled={submitting}
                  />
                  <span>Send me exclusive drops and early-bird show tickets.</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 border border-foreground bg-foreground py-3 text-eyebrow text-background transition-colors hover:bg-background hover:text-foreground disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>

              <div className="space-y-2 pt-2 text-center text-sm">
                <div>
                  Already have an account?{" "}
                  <Link to="/account" className="underline underline-offset-4">
                    Sign In
                  </Link>
                </div>
                <Link
                  to="/cart"
                  className="block text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Continue as guest
                </Link>
              </div>
            </form>
          </div>
        </section>
      </div>
    </Shell>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-foreground/80"
      >
        {label}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-err`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="currentColor" d="M44.5 20H24v8.5h11.7C34.6 33 30 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l6-6C34.1 5.5 29.3 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.4-.2-2.7-.5-4z"/>
    </svg>
  );
}
