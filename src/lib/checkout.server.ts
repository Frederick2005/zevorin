// Server-only checkout, payment-initiation and settlement logic.
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  CheckoutError,
  evaluateTransaction,
  orderIdFromTxRef,
  priceCart,
  type CartLineInput,
} from "./pricing";
import {
  createPaymentLink,
  verifyById,
  verifyByReference,
} from "./flutterwave.server";

export type Customer = {
  email: string;
  name: string;
  phone: string;
  address: string;
};
export type PublicOrderStatus = {
  orderId: string;
  status: "pending" | "paid" | "failed" | "cancelled" | "shipped";
  total: number;
  currency: string;
};

/** Returns the signed-in user's id from a Bearer token, or null for guests. */
export async function userIdFromAuthHeader(
  header: string | null,
): Promise<string | null> {
  if (!header?.startsWith("Bearer ")) return null;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const token = header.slice(7);
  const { data, error } = await client.auth.getClaims(token);
  return error || !data?.claims?.sub ? null : data.claims.sub;
}

function newTxRef(orderId: string) {
  return `zev-${orderId}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
}

function siteOrigin(requestOrigin: string): string {
  return (process.env.SITE_URL || requestOrigin).replace(/\/+$/, "");
}

async function startPayment(
  order: {
    id: string;
    total_amount: number;
    currency: string;
    customer_email: string;
    customer_name: string;
    customer_phone: string;
  },
  requestOrigin: string,
): Promise<string> {
  const txRef = newTxRef(order.id);
  const { error } = await supabaseAdmin
    .from("orders")
    .update({ tx_ref: txRef, status: "pending" })
    .eq("id", order.id)
    .in("status", ["pending", "failed", "cancelled"]);
  if (error) throw error;
  try {
    return await createPaymentLink({
      txRef,
      amount: Number(order.total_amount),
      currency: order.currency,
      redirectUrl: `${siteOrigin(requestOrigin)}/order/${order.id}`,
      customer: {
        email: order.customer_email,
        name: order.customer_name,
        phone: order.customer_phone,
      },
      orderId: order.id,
    });
  } catch (e) {
    await supabaseAdmin
      .from("orders")
      .update({ status: "failed" })
      .eq("id", order.id)
      .eq("status", "pending");
    throw e;
  }
}

export async function createCheckout(
  lines: CartLineInput[],
  customer: Customer,
  userId: string | null,
  requestOrigin: string,
) {
  const productIds = [
    ...new Set(lines.map((l) => l.productId).filter(Boolean)),
  ] as string[];
  const showIds = [
    ...new Set(lines.map((l) => l.showId).filter(Boolean)),
  ] as string[];

  const [{ data: products, error: pErr }, { data: shows, error: sErr }] =
    await Promise.all([
      productIds.length
        ? supabaseAdmin
            .from("products")
            .select("id,name,price,stock,sizes,colors")
            .in("id", productIds)
        : Promise.resolve({ data: [], error: null }),
      showIds.length
        ? supabaseAdmin
            .from("shows")
            .select("id,title,ticket_price,date")
            .in("id", showIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
  if (pErr || sErr) throw pErr ?? sErr;

  const { items, total } = priceCart(lines, products ?? [], shows ?? []);

  const orderId = crypto.randomUUID();
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .insert({
      id: orderId,
      user_id: userId,
      customer_email: customer.email,
      customer_name: customer.name,
      customer_phone: customer.phone,
      shipping_address: customer.address,
      items,
      total_amount: total,
      currency: "UGX",
      status: "pending",
      payment_method: "mobile_money",
    })
    .select(
      "id,total_amount,currency,customer_email,customer_name,customer_phone",
    )
    .single();
  if (error) throw error;

  const link = await startPayment(order, requestOrigin);
  return { orderId, link };
}

export async function retryPayment(orderId: string, requestOrigin: string) {
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id,status,total_amount,currency,customer_email,customer_name,customer_phone",
    )
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  if (!order) throw new CheckoutError("unavailable", "Order not found.");
  if (!["pending", "failed", "cancelled"].includes(order.status)) {
    throw new CheckoutError("unavailable", "This order has already been paid.");
  }
  // Settle first: the customer may have paid an earlier link already.
  const current = await verifyAndSettle(orderId);
  if (current.status === "paid" || current.status === "shipped") {
    throw new CheckoutError("unavailable", "This order has already been paid.");
  }
  return { link: await startPayment(order, requestOrigin) };
}

/**
 * Confirms payment with Flutterwave itself (never trusts the browser or the
 * webhook body) and settles the order idempotently.
 */
export async function verifyAndSettle(
  orderId: string,
  transactionId?: string,
): Promise<PublicOrderStatus> {
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("id,status,total_amount,currency,tx_ref")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  if (!order) throw new CheckoutError("unavailable", "Order not found.");

  let status = order.status as PublicOrderStatus["status"];
  if (status === "pending" || status === "failed" || status === "cancelled") {
    const tx = transactionId
      ? await verifyById(transactionId)
      : order.tx_ref
        ? await verifyByReference(order.tx_ref)
        : null;
    const outcome = evaluateTransaction(order, tx);

    if (outcome === "paid" && tx) {
      const { error: rpcErr } = await supabaseAdmin.rpc("settle_order_paid", {
        _order_id: order.id,
        _tx_id: tx.id,
        _tx_ref: tx.tx_ref,
      });
      if (rpcErr) throw rpcErr;
      status = "paid";
    } else if (outcome === "failed" || outcome === "cancelled") {
      await supabaseAdmin
        .from("orders")
        .update({ status: outcome })
        .eq("id", order.id)
        .eq("status", "pending");
      if (status === "pending") status = outcome;
    } else if (outcome === "mismatch") {
      // Never mark paid. Needs manual review in the Flutterwave dashboard.
      console.error(`[payments] verification mismatch for order ${order.id}`);
    }
  }
  return {
    orderId: order.id,
    status,
    total: Number(order.total_amount),
    currency: order.currency,
  };
}

export async function handleWebhookPayload(payload: unknown) {
  const data = (
    payload as { data?: { id?: number | string; tx_ref?: string } } | null
  )?.data;
  if (!data?.tx_ref) return;
  const orderId = orderIdFromTxRef(data.tx_ref);
  if (!orderId) return;
  await verifyAndSettle(
    orderId,
    data.id !== undefined ? String(data.id) : undefined,
  );
}
