// Pure checkout logic (no I/O) so it can be unit-tested and shared.

export type CheckoutErrorCode =
  | "invalid_item"
  | "unavailable"
  | "out_of_stock"
  | "invalid_option";

export class CheckoutError extends Error {
  readonly code: CheckoutErrorCode;
  constructor(code: CheckoutErrorCode, message: string) {
    super(message);
    this.name = "CheckoutError";
    this.code = code;
  }
}

export type CartLineInput = {
  productId?: string;
  showId?: string;
  quantity: number;
  size?: string;
  color?: string;
};

export type ProductRow = {
  id: string;
  name: string;
  price: number;
  stock: number;
  sizes: string[];
  colors: string[];
};

export type ShowRow = {
  id: string;
  title: string;
  ticket_price: number;
  date: string;
};

export type PricedLine = {
  product_id?: string;
  show_id?: string;
  name: string;
  price: number;
  quantity: number;
  type: "clothing" | "ticket";
  size?: string;
  color?: string;
};

export const MAX_QTY_PER_LINE = 20;

/** Prices a cart using ONLY trusted database rows. Client prices are never read. */
export function priceCart(
  lines: CartLineInput[],
  products: ProductRow[],
  shows: ShowRow[],
  now: Date = new Date(),
): { items: PricedLine[]; total: number } {
  if (lines.length === 0)
    throw new CheckoutError("invalid_item", "Your bag is empty.");
  const byProduct = new Map(products.map((p) => [p.id, p]));
  const byShow = new Map(shows.map((s) => [s.id, s]));
  const wantedPerProduct = new Map<string, number>();
  const items: PricedLine[] = [];

  for (const line of lines) {
    if (!!line.productId === !!line.showId) {
      throw new CheckoutError(
        "invalid_item",
        "Each item must be a product or a show ticket.",
      );
    }
    if (
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > MAX_QTY_PER_LINE
    ) {
      throw new CheckoutError("invalid_item", "Invalid quantity.");
    }

    if (line.productId) {
      const p = byProduct.get(line.productId);
      if (!p)
        throw new CheckoutError(
          "unavailable",
          "An item in your bag is no longer available.",
        );
      if (p.sizes.length > 0 && (!line.size || !p.sizes.includes(line.size))) {
        throw new CheckoutError(
          "invalid_option",
          `Please choose a valid size for ${p.name}.`,
        );
      }
      if (
        p.colors.length > 0 &&
        (!line.color || !p.colors.includes(line.color))
      ) {
        throw new CheckoutError(
          "invalid_option",
          `Please choose a valid color for ${p.name}.`,
        );
      }
      const wanted = (wantedPerProduct.get(p.id) ?? 0) + line.quantity;
      wantedPerProduct.set(p.id, wanted);
      if (wanted > p.stock) {
        throw new CheckoutError(
          "out_of_stock",
          `${p.name} does not have enough stock.`,
        );
      }
      items.push({
        product_id: p.id,
        name: p.name,
        price: Number(p.price),
        quantity: line.quantity,
        type: "clothing",
        size: line.size,
        color: line.color,
      });
    } else {
      const s = byShow.get(line.showId!);
      if (!s)
        throw new CheckoutError(
          "unavailable",
          "A show in your bag is no longer available.",
        );
      if (new Date(s.date).getTime() < now.getTime()) {
        throw new CheckoutError(
          "unavailable",
          `${s.title} has already taken place.`,
        );
      }
      items.push({
        show_id: s.id,
        name: s.title,
        price: Number(s.ticket_price),
        quantity: line.quantity,
        type: "ticket",
      });
    }
  }

  // UGX has no minor unit: work in whole shillings.
  const total = items.reduce(
    (sum, i) => sum + Math.round(i.price) * i.quantity,
    0,
  );
  if (!Number.isSafeInteger(total) || total <= 0) {
    throw new CheckoutError("invalid_item", "Your order total is invalid.");
  }
  return { items, total };
}

export type FlutterwaveTx = {
  status: string;
  tx_ref: string;
  amount: number;
  currency: string;
};

export type SettlementOutcome =
  | "paid"
  | "failed"
  | "cancelled"
  | "pending"
  | "mismatch";

export const TX_REF_PREFIX = "zev-";

/** tx_ref format: zev-<orderId>-<attempt>. Returns the order id or null. */
export function orderIdFromTxRef(txRef: string): string | null {
  const m =
    /^zev-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-[0-9a-z]{4,12}$/i.exec(
      txRef,
    );
  return m ? m[1].toLowerCase() : null;
}

/** Decides what a *provider-verified* transaction means for an order. */
export function evaluateTransaction(
  order: { id: string; total_amount: number; currency: string },
  tx: FlutterwaveTx | null,
): SettlementOutcome {
  if (!tx) return "pending";
  if (orderIdFromTxRef(tx.tx_ref) !== order.id.toLowerCase()) return "mismatch";
  const status = tx.status.toLowerCase();
  if (status === "successful" || status === "completed") {
    const amountOk = Number(tx.amount) >= Number(order.total_amount);
    const currencyOk =
      tx.currency?.toUpperCase() === order.currency.toUpperCase();
    return amountOk && currencyOk ? "paid" : "mismatch";
  }
  if (status === "failed") return "failed";
  if (status === "cancelled") return "cancelled";
  return "pending";
}
