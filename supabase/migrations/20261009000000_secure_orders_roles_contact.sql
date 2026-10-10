-- =====================================================================
-- Zevorin: secure orders, replace first-user-becomes-admin, harden contact
-- Forward-only and non-destructive: no DROP TABLE, no DELETE, no TRUNCATE.
-- Safe to re-run (idempotent). Review before applying to any database.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ORDERS: browsers may no longer write orders directly.
--    Orders are created and updated only by trusted server code that uses
--    the service_role key (which bypasses RLS). Guest checkout therefore
--    goes through the server function, never a direct insert.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
REVOKE INSERT, UPDATE, DELETE ON public.orders FROM anon, authenticated;
REVOKE ALL ON public.orders FROM anon;
GRANT SELECT ON public.orders TO authenticated;   -- RLS still limits rows
GRANT ALL ON public.orders TO service_role;

-- Payment bookkeeping columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'UGX',
  ADD COLUMN IF NOT EXISTS tx_ref text,
  ADD COLUMN IF NOT EXISTS flutterwave_tx_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Order lifecycle: pending -> paid -> shipped; pending -> failed/cancelled;
-- failed/cancelled -> pending (customer retries) or paid (late payment confirmed).
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending','paid','failed','cancelled','shipped'));

CREATE UNIQUE INDEX IF NOT EXISTS orders_tx_ref_key
  ON public.orders (tx_ref) WHERE tx_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_user_id_created_idx
  ON public.orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_created_idx
  ON public.orders (status, created_at DESC);

-- Guard: a paid/shipped order can never fall back to an unpaid state, and
-- money/ownership fields are immutable after creation.
CREATE OR REPLACE FUNCTION public.guard_order_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.total_amount IS DISTINCT FROM OLD.total_amount
     OR NEW.items IS DISTINCT FROM OLD.items
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.currency IS DISTINCT FROM OLD.currency THEN
    RAISE EXCEPTION 'order amount, items, owner and currency are immutable';
  END IF;
  IF OLD.status IN ('paid','shipped') AND NEW.status IN ('pending','failed','cancelled') THEN
    RAISE EXCEPTION 'a paid order cannot return to an unpaid status';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_guard_update ON public.orders;
CREATE TRIGGER orders_guard_update
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.guard_order_update();

-- Atomic, idempotent settlement. Marks the order paid exactly once and
-- decrements product stock in the same transaction. Returns true only the
-- first time it transitions the order to paid.
CREATE OR REPLACE FUNCTION public.settle_order_paid(
  _order_id uuid, _tx_id text, _tx_ref text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _item jsonb;
  _changed int;
BEGIN
  UPDATE public.orders
     SET status = 'paid', paid_at = now(),
         flutterwave_tx_id = _tx_id, payment_reference = _tx_ref
   WHERE id = _order_id AND status IN ('pending','failed','cancelled');
  GET DIAGNOSTICS _changed = ROW_COUNT;
  IF _changed = 0 THEN
    RETURN false;  -- already paid/shipped, or order does not exist
  END IF;

  FOR _item IN SELECT * FROM jsonb_array_elements(
    (SELECT items FROM public.orders WHERE id = _order_id)
  ) LOOP
    IF _item->>'product_id' IS NOT NULL THEN
      UPDATE public.products
         SET stock = GREATEST(stock - COALESCE((_item->>'quantity')::int, 0), 0)
       WHERE id = (_item->>'product_id')::uuid;
    END IF;
  END LOOP;
  RETURN true;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.settle_order_paid(uuid, text, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_order_paid(uuid, text, text) TO service_role;

-- ---------------------------------------------------------------------
-- 2. ROLES: public sign-up must never create an administrator.
--    The existing trigger stays, but now only ever assigns the 'user' role.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_role_on_signup()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.assign_role_on_signup() FROM public, anon, authenticated;

-- Controlled admin provisioning. Not callable from the browser or the API:
-- run it yourself in the Supabase SQL editor (see docs/ADMIN_SETUP.md).
CREATE OR REPLACE FUNCTION public.grant_admin(_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RAISE EXCEPTION 'no such user';
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.grant_admin(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_admin(uuid) TO service_role;

-- user_roles: clients can only read their own row (no insert/update/delete).
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. SHOWS: tidy grants (no write policies exist, so writes were already
--    blocked by RLS; remove the misleading grants).
-- ---------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON public.shows FROM anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. CONTACT MESSAGES: bound field sizes (NOT VALID = existing rows are
--    not re-checked). Rate limiting is applied in the server function.
-- ---------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_lengths'
  ) THEN
    ALTER TABLE public.contact_messages
      ADD CONSTRAINT contact_messages_lengths CHECK (
        char_length(name) BETWEEN 1 AND 120
        AND char_length(email) BETWEEN 3 AND 254
        AND char_length(message) BETWEEN 1 AND 5000
      ) NOT VALID;
  END IF;
END $$;
