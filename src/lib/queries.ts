import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  category: "men" | "women" | "kids" | "unisex";
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  is_featured: boolean;
  created_at: string;
};


export const productsQuery = (category?: string) =>
  queryOptions({
    queryKey: ["products", category ?? "all"],
    queryFn: async () => {
      let q = supabase.from("products").select("*").order("created_at", { ascending: false });
      if (category && category !== "all") q = q.eq("category", category);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Product[];
    },
  });

export const featuredProductsQuery = () =>
  queryOptions({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_featured", true)
        .limit(6);
      if (error) throw error;
      return data as unknown as Product[];
    },
  });

export const productByIdQuery = (id: string) =>
  queryOptions({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as unknown as Product | null;
    },
  });
