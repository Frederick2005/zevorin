# Checkout and Flutterwave (v3)

Flow: browser sends product/show ids + quantities + customer details →
`createCheckout` server function prices the cart from the database, creates a
`pending` order (guest or signed-in) and a Flutterwave payment link →
customer pays → returns to `/order/<id>` → the server verifies the transaction
with Flutterwave's API (and the webhook does the same) → `settle_order_paid`
marks the order paid once and decrements stock.

Setup (test mode first):
1. Flutterwave Dashboard → Settings → API: copy the **test** secret key → Worker secret `FLUTTERWAVE_SECRET_KEY`.
2. Settings → Webhooks: URL `https://<your-site>/api/flutterwave-webhook`, choose a long random **Secret hash**, save the same value as Worker secret `FLUTTERWAVE_WEBHOOK_HASH`.
3. Apply `supabase/migrations/20261009000000_secure_orders_roles_contact.sql`.
4. Set `SUPABASE_SERVICE_ROLE_KEY` as a Worker secret.
