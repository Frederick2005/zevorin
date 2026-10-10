import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/cart-store";
import { toast } from "sonner";
import type { Product } from "@/lib/queries";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({ meta: [{ title: "Dashboard — ZÉVORIN" }] }),
  component: Dashboard,
});

type FormState = {
  name: string;
  slug: string;
  description: string;
  price: string;
  category: "men" | "women" | "kids" | "unisex";
  images: string;
  sizes: string;
  colors: string;
  stock: string;
  is_featured: boolean;
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  description: "",
  price: "",
  category: "unisex",
  images: "",
  sizes: "S, M, L, XL",
  colors: "Black, White",
  stock: "10",
  is_featured: false,
};

function Dashboard() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        navigate({ to: "/account" });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id);
      const admin = (roles ?? []).some((r) => r.role === "admin");
      setIsAdmin(admin);
      setChecking(false);
    })();
  }, [navigate]);

  const loadProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    setProducts((data as unknown as Product[]) ?? []);
  };

  useEffect(() => {
    if (isAdmin) loadProducts();
  }, [isAdmin]);

  if (checking) {
    return (
      <Shell>
        <div className="p-12 text-sm text-muted-foreground">Loading…</div>
      </Shell>
    );
  }

  if (!isAdmin) {
    return (
      <Shell>
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <div className="text-eyebrow text-muted-foreground">Restricted</div>
          <h1 className="text-display mt-4 text-3xl font-bold md:text-4xl">
            Admin access only
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            This area is reserved for the ZÉVORIN atelier administrator.
          </p>
        </div>
      </Shell>
    );
  }
  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast.error(`${file.name}: use a JPG, PNG or WebP image`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5 MB`);
        continue;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file, {
          contentType: file.type,
          cacheControl: "31536000",
        });
      if (error) {
        console.error("Image upload failed:", error.message);
        toast.error(`Could not upload ${file.name}`);
        continue;
      }
      urls.push(
        supabase.storage.from("product-images").getPublicUrl(path).data
          .publicUrl,
      );
    }
    setUploading(false);
    if (urls.length > 0) {
      setForm((f) => ({
        ...f,
        images: [f.images.trim(), ...urls].filter(Boolean).join("\n"),
      }));
      toast.success(`${urls.length} image(s) uploaded`);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const slug =
      form.slug.trim() ||
      form.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    const payload = {
      name: form.name.trim(),
      slug,
      description: form.description.trim() || null,
      price: Number(form.price),
      category: form.category,
      images: form.images
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean),
      sizes: form.sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      colors: form.colors
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      stock: Number(form.stock) || 0,
      is_featured: form.is_featured,
    };
    const { error } = editingId
      ? await supabase.from("products").update(payload).eq("id", editingId)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editingId ? "Product updated" : "Product added");
    setForm(emptyForm);
    setEditingId(null);
    loadProducts();
  };

  const removeProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      loadProducts();
    }
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      price: String(p.price),
      category: (p.category as FormState["category"]) ?? "unisex",
      images: (p.images ?? []).join("\n"),
      sizes: (p.sizes ?? []).join(", "),
      colors: (p.colors ?? []).join(", "),
      stock: String(p.stock ?? 0),
      is_featured: !!p.is_featured,
    });
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const input =
    "w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground";

  return (
    <Shell>
      <div className="mx-auto max-w-[1200px] px-5 py-12 md:px-8 md:py-16">
        <div className="border-b border-border pb-8">
          <div className="text-eyebrow text-muted-foreground">Admin</div>
          <h1 className="text-display mt-2 text-3xl font-bold md:text-5xl">
            Dashboard
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Manage the ZÉVORIN catalogue. Add new pieces, retire old ones.
          </p>
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <form
            onSubmit={submit}
            className="space-y-4 border border-border p-6"
          >
            <div className="flex items-center justify-between">
              <div className="text-eyebrow">
                {editingId ? "Edit product" : "New product"}
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-eyebrow text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              )}
            </div>

            <input
              required
              placeholder="Name"
              className={input}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              placeholder="Slug (auto if blank)"
              className={input}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
            <textarea
              placeholder="Description"
              rows={3}
              className={input}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                type="number"
                placeholder="Price (UGX)"
                className={input}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
              <select
                className={input}
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value as FormState["category"],
                  })
                }
              >
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="kids">Kids</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>
            <label className="block">
              <span className="text-eyebrow mb-1 block">
                Upload images from your device
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={uploading}
                onChange={handleFiles}
                className="w-full text-sm file:mr-3 file:border file:border-border file:bg-background file:px-3 file:py-2"
              />
              {uploading && (
                <span className="mt-1 block text-xs text-muted-foreground">
                  Uploading…
                </span>
              )}
            </label>
            <textarea
              placeholder="Image URLs (comma or newline separated)"
              rows={2}
              className={input}
              value={form.images}
              onChange={(e) => setForm({ ...form, images: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Sizes (comma)"
                className={input}
                value={form.sizes}
                onChange={(e) => setForm({ ...form, sizes: e.target.value })}
              />
              <input
                placeholder="Colors (comma)"
                className={input}
                value={form.colors}
                onChange={(e) => setForm({ ...form, colors: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Stock"
                className={input}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) =>
                    setForm({ ...form, is_featured: e.target.checked })
                  }
                />
                Featured
              </label>
            </div>
            <button
              disabled={saving || uploading}
              className="w-full bg-foreground py-3 text-eyebrow text-background hover:bg-foreground/85 disabled:opacity-50"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Add product"}
            </button>
          </form>

          <div>
            <div className="text-eyebrow mb-4">
              Catalogue ({products.length})
            </div>
            <ul className="divide-y divide-border border-y border-border">
              {products.map((p) => (
                <li
                  key={p.id}
                  className="grid grid-cols-12 items-center gap-3 py-3 text-sm"
                >
                  <div className="col-span-2 aspect-square overflow-hidden bg-muted">
                    {p.images?.[0] && (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="col-span-5">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs uppercase text-muted-foreground">
                      {p.category}
                    </div>
                  </div>
                  <div className="col-span-3 text-right tabular-nums">
                    {formatPrice(Number(p.price))}
                  </div>
                  <div className="col-span-2 text-right space-x-3">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-eyebrow text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeProduct(p.id)}
                      className="text-eyebrow text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}

              {products.length === 0 && (
                <li className="py-8 text-center text-sm text-muted-foreground">
                  No products yet
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </Shell>
  );
}
