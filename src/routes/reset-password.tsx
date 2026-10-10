import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/layout/Shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — ZÉVORIN" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState<"checking" | "ok" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // The recovery link signs the user in temporarily; an expired or reused
    // link leaves no session.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady("ok");
    });
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      setReady(data.session ? "ok" : "invalid");
    }, 1500);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (password.length < 8)
      return void toast.error("Use at least 8 characters.");
    if (password !== confirm)
      return void toast.error("Passwords do not match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      console.error("Password update failed:", error.message);
      toast.error(
        "We couldn't update your password. Request a new reset link and try again.",
      );
      return;
    }
    toast.success("Password updated.");
    navigate({ to: "/" });
  };

  const input =
    "w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground";
  return (
    <Shell>
      <div className="mx-auto max-w-md px-5 py-24">
        <h1 className="text-display text-3xl font-bold">Reset password</h1>
        {ready === "checking" && (
          <p className="mt-6 text-sm text-muted-foreground">
            Checking your link…
          </p>
        )}
        {ready === "invalid" && (
          <p className="mt-6 text-sm" role="alert">
            This reset link is invalid or has expired.{" "}
            <Link to="/account" className="underline">
              Request a new one
            </Link>
            .
          </p>
        )}
        {ready === "ok" && (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <input
              type="password"
              autoComplete="new-password"
              placeholder="New password"
              className={input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              className={input}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <button
              disabled={busy}
              className="w-full bg-foreground py-3 text-eyebrow text-background disabled:opacity-50"
            >
              {busy ? "Saving…" : "Set new password"}
            </button>
          </form>
        )}
      </div>
    </Shell>
  );
}
