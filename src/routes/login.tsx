import { createFileRoute, redirect } from "@tanstack/react-router";

// /login is an alias: the sign-in form lives on /account.
export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    throw redirect({ to: "/account" });
  },
});
