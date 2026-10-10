// Server-only Flutterwave v3 client. Never import from browser code.
import type { FlutterwaveTx } from "./pricing";

const API = "https://api.flutterwave.com/v3";

function secret(): string {
  const key = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!key) throw new Error("FLUTTERWAVE_SECRET_KEY is not configured");
  return key;
}

type FlwEnvelope<T> = { status: string; message?: string; data?: T };

async function flw<T>(
  path: string,
  init?: RequestInit,
): Promise<FlwEnvelope<T>> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    signal: AbortSignal.timeout(15_000),
  });
  try {
    return (await res.json()) as FlwEnvelope<T>;
  } catch {
    return {
      status: "error",
      message: `Flutterwave returned HTTP ${res.status}`,
    };
  }
}

export async function createPaymentLink(p: {
  txRef: string;
  amount: number;
  currency: string;
  redirectUrl: string;
  customer: { email: string; name: string; phone: string };
  orderId: string;
}): Promise<string> {
  const json = await flw<{ link: string }>("/payments", {
    method: "POST",
    body: JSON.stringify({
      tx_ref: p.txRef,
      amount: p.amount,
      currency: p.currency,
      redirect_url: p.redirectUrl,
      payment_options: "mobilemoneyuganda,card",
      customer: {
        email: p.customer.email,
        phonenumber: p.customer.phone,
        name: p.customer.name,
      },
      customizations: { title: "ZÉVORIN", description: "Order payment" },
      meta: { order_id: p.orderId },
    }),
  });
  if (json.status !== "success" || !json.data?.link) {
    console.error(
      "[flutterwave] payment initiation failed:",
      json.message ?? "unknown",
    );
    throw new Error("payment_initiation_failed");
  }
  return json.data.link;
}

type RawTx = {
  id: number | string;
  tx_ref: string;
  status: string;
  amount: number;
  currency: string;
};

function toTx(d: RawTx | undefined): (FlutterwaveTx & { id: string }) | null {
  if (!d) return null;
  return {
    id: String(d.id),
    tx_ref: d.tx_ref,
    status: d.status,
    amount: Number(d.amount),
    currency: d.currency,
  };
}

export async function verifyById(transactionId: string) {
  if (!/^\d{1,20}$/.test(transactionId)) return null;
  const json = await flw<RawTx>(`/transactions/${transactionId}/verify`);
  return json.status === "success" ? toTx(json.data) : null;
}

export async function verifyByReference(txRef: string) {
  const json = await flw<RawTx>(
    `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
  );
  return json.status === "success" ? toTx(json.data) : null;
}

/** Constant-time string comparison for webhook secret hashes. */
export function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++)
    diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}
