import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// The browser sends ONLY what the customer chose. Prices, totals, status,
// owner and redirect URL are all decided on the server.
const CheckoutInput = z.object({
  items: z
    .array(
      z
        .object({
          productId: z.string().uuid().optional(),
          showId: z.string().uuid().optional(),
          quantity: z.number().int().min(1).max(20),
          size: z.string().max(40).optional(),
          color: z.string().max(40).optional(),
        })
        .refine(
          (i) => !!i.productId !== !!i.showId,
          "Each item needs a product or a show",
        ),
    )
    .min(1)
    .max(50),
  customer: z.object({
    email: z.string().trim().email().max(254),
    name: z.string().trim().min(2).max(120),
    phone: z
      .string()
      .trim()
      .regex(/^\+?\d{9,15}$/, "Enter a valid phone number"),
    address: z.string().trim().min(5).max(500),
  }),
});

const OrderRef = z.object({
  orderId: z.string().uuid(),
  transactionId: z
    .string()
    .regex(/^\d{1,20}$/)
    .optional(),
});

const GENERIC = "We couldn't process your request. Please try again.";

async function run<T>(fn: () => Promise<T>): Promise<T> {
  const { CheckoutError } = await import("./pricing");
  try {
    return await fn();
  } catch (e) {
    if (e instanceof CheckoutError) throw new Error(e.message);
    console.error(
      "[payments]",
      e instanceof Error ? e.message : "unknown error",
    );
    if (e instanceof Error && e.message === "payment_initiation_failed") {
      throw new Error(
        "We couldn't start your payment. Please try again in a moment.",
      );
    }
    throw new Error(GENERIC);
  }
}

async function requestContext() {
  const { getRequest } = await import("@tanstack/react-start/server");
  const request = getRequest();
  return {
    origin: new URL(request.url).origin,
    authHeader: request.headers.get("authorization"),
  };
}

/** Validates the cart, prices it server-side, creates a pending order and a payment link. */
export const createCheckout = createServerFn({ method: "POST" })
  .validator((data: unknown) => CheckoutInput.parse(data))
  .handler(({ data }) =>
    run(async () => {
      const s = await import("./checkout.server");
      const { origin, authHeader } = await requestContext();
      const userId = await s.userIdFromAuthHeader(authHeader);
      return s.createCheckout(data.items, data.customer, userId, origin);
    }),
  );

/** Re-checks payment with Flutterwave and returns the real order status. */
export const getOrderStatus = createServerFn({ method: "POST" })
  .validator((data: unknown) => OrderRef.parse(data))
  .handler(({ data }) =>
    run(async () => {
      const s = await import("./checkout.server");
      return s.verifyAndSettle(data.orderId, data.transactionId);
    }),
  );

/** New payment link for an unpaid order (never duplicates a paid order). */
export const retryPayment = createServerFn({ method: "POST" })
  .validator((data: unknown) => OrderRef.pick({ orderId: true }).parse(data))
  .handler(({ data }) =>
    run(async () => {
      const s = await import("./checkout.server");
      const { origin } = await requestContext();
      return s.retryPayment(data.orderId, origin);
    }),
  );
