import { createFileRoute } from "@tanstack/react-router";

// Flutterwave v3 webhooks carry the dashboard "secret hash" in the `verif-hash`
// header. The body is NOT trusted: we only read the tx_ref/id and then ask
// Flutterwave's API to confirm the transaction before settling anything.
export const Route = createFileRoute("/api/flutterwave-webhook")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const expected = process.env.FLUTTERWAVE_WEBHOOK_HASH;
        if (!expected) {
          console.error("[webhook] FLUTTERWAVE_WEBHOOK_HASH is not configured");
          return new Response("Webhook not configured", { status: 503 });
        }
        const { safeEqual } = await import("@/lib/flutterwave.server");
        const received = request.headers.get("verif-hash") ?? "";
        if (!safeEqual(received, expected)) {
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          const payload = await request.json();
          const { handleWebhookPayload } =
            await import("@/lib/checkout.server");
          await handleWebhookPayload(payload);
        } catch (e) {
          console.error(
            "[webhook] processing error:",
            e instanceof Error ? e.message : "unknown",
          );
          return new Response("Error", { status: 500 }); // Flutterwave will retry
        }
        return new Response("OK", { status: 200 });
      },
    },
  },
});
