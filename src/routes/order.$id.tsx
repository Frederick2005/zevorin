import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Shell } from "@/components/layout/Shell";
import { formatPrice, useCart } from "@/lib/cart-store";
import { getOrderStatus, retryPayment } from "@/lib/payments.functions";
import { toast } from "sonner";

// Flutterwave appends ?status=...&tx_ref=...&transaction_id=... on return.
// These are only HINTS: the real status always comes from the server, which
// verifies the payment with Flutterwave.
const searchSchema = z.object({
  transaction_id: z.coerce
    .string()
    .regex(/^\d{1,20}$/)
    .optional()
    .catch(undefined),
  status: z.string().max(20).optional().catch(undefined),
});

export const Route = createFileRoute("/order/$id")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Your order — ZÉVORIN" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderStatusPage,
});

function OrderStatusPage() {
  const { id } = Route.useParams();
  const { transaction_id, status: returnHint } = Route.useSearch();
  const clear = useCart((s) => s.clear);
  const [retrying, setRetrying] = useState(false);
  const [polls, setPolls] = useState(0);

  const q = useQuery({
    queryKey: ["order-status", id, transaction_id],
    queryFn: () =>
      getOrderStatus({ data: { orderId: id, transactionId: transaction_id } }),
    // Keep checking while pending (webhook may land after the redirect), max ~2 min.
    refetchInterval: (query) =>
      query.state.data?.status === "pending" && polls < 30 ? 4000 : false,
    retry: 1,
  });
  useEffect(() => {
    if (q.dataUpdatedAt) setPolls((n) => n + 1);
  }, [q.dataUpdatedAt]);

  const status = q.data?.status;
  useEffect(() => {
    if (status === "paid" || status === "shipped") clear();
  }, [status, clear]);

  const retry = async () => {
    setRetrying(true);
    try {
      const { link } = await retryPayment({ data: { orderId: id } });
      window.location.href = link;
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not restart payment.",
      );
      setRetrying(false);
    }
  };

  let title = "Checking your payment…";
  let body =
    "Please wait while we confirm your payment with our payment provider.";
  let canRetry = false;
  if (q.isError) {
    title = "We couldn't check your order";
    body =
      "Something went wrong while confirming your payment. Please refresh in a moment. If you were charged, contact us with your order reference.";
  } else if (status === "paid" || status === "shipped") {
    title = "Payment confirmed";
    body = "Thank you. Your order has been received and is being prepared.";
  } else if (status === "failed") {
    title = "Payment failed";
    body =
      "Your payment was not completed and you have not been charged for this attempt. You can try again.";
    canRetry = true;
  } else if (
    status === "cancelled" ||
    (status === "pending" && returnHint === "cancelled")
  ) {
    title = "Payment cancelled";
    body =
      "You cancelled the payment. Your bag is still saved, so you can try again whenever you're ready.";
    canRetry = true;
  } else if (status === "pending") {
    title = "Payment pending";
    body =
      polls >= 30
        ? "We haven't received confirmation yet. If you approved the payment on your phone, it may take a few minutes. Refresh this page to check again."
        : "We're waiting for confirmation. Approve the prompt on your phone if you haven't yet.";
    canRetry = polls >= 30 || returnHint === "cancelled";
  }

  return (
    <Shell>
      <div
        className="mx-auto max-w-xl px-5 py-24 text-center"
        role="status"
        aria-live="polite"
      >
        <div className="text-eyebrow text-muted-foreground">
          Order {id.slice(0, 8).toUpperCase()}
        </div>
        <h1 className="text-display mt-3 text-3xl font-bold md:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">{body}</p>
        {q.data && (
          <div className="mt-4 text-sm tabular-nums">
            {formatPrice(q.data.total)}
          </div>
        )}
        <div className="mt-8 flex flex-col items-center gap-4">
          {canRetry && (
            <button
              onClick={retry}
              disabled={retrying}
              className="bg-foreground px-8 py-3 text-eyebrow text-background disabled:opacity-50"
            >
              {retrying ? "Redirecting…" : "Try payment again"}
            </button>
          )}
          {q.isError && (
            <button
              onClick={() => q.refetch()}
              className="text-eyebrow underline"
            >
              Check again
            </button>
          )}
          <Link to="/shop" className="text-eyebrow underline">
            Continue shopping
          </Link>
        </div>
      </div>
    </Shell>
  );
}
