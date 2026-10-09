import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  orderId: z.string(),
  amount: z.number().positive(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string(),
  redirectUrl: z.string().url(),
});

/**
 * Initiates a Flutterwave hosted-payment session for Uganda Mobile Money
 * (MTN MoMo, Airtel Money) and returns the redirect link.
 * Requires the FLUTTERWAVE_SECRET_KEY secret to be configured.
 */
export const initiatePayment = createServerFn({ method: "POST" })
  .validator((data) => Input.parse(data))
  .handler(async ({ data }) => {
    const secret = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secret) {
      throw new Error(
        "Flutterwave is not configured. Add the FLUTTERWAVE_SECRET_KEY secret to enable payments.",
      );
    }

    const payload = {
      tx_ref: `zev-${data.orderId}`,
      amount: data.amount,
      currency: "UGX",
      redirect_url: data.redirectUrl,
      payment_options: "mobilemoneyuganda,card",
      customer: { email: data.email, phonenumber: data.phone, name: data.name },
      customizations: { title: "ZÉVORIN", description: "Order payment" },
      meta: { order_id: data.orderId },
    };

    const res = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as {
      status: string;
      data?: { link: string };
      message?: string;
    };
    if (json.status !== "success" || !json.data?.link) {
      throw new Error(json.message ?? "Flutterwave payment initiation failed");
    }
    return { link: json.data.link };
  });
