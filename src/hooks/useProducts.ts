import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DbProduct {
  id: string;
  name: string;
  description: string | null;
  pant_details: string;
  shirt_details: string;
  price: number;
  original_price: number | null;
  category: 'Formal' | 'Business Casual' | 'Casual';
  image_url: string | null;
  featured: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface DbProductStock {
  id: string;
  product_id: string;
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface ProductWithStock extends DbProduct {
  stock: DbProductStock[];
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<ProductWithStock[]> => {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      const { data: stock, error: stockError } = await supabase
        .from('product_stock')
        .select('*');

      if (stockError) throw stockError;

      return (products || []).map((product) => ({
        ...product,
        stock: (stock || []).filter((s) => s.product_id === product.id),
      }));
    },
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['featured-products'],
    queryFn: async (): Promise<ProductWithStock[]> => {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (productsError) throw productsError;

      const productIds = (products || []).map((p) => p.id);
      
      const { data: stock, error: stockError } = await supabase
        .from('product_stock')
        .select('*')
        .in('product_id', productIds);

      if (stockError) throw stockError;

      return (products || []).map((product) => ({
        ...product,
        stock: (stock || []).filter((s) => s.product_id === product.id),
      }));
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async (): Promise<ProductWithStock | null> => {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (productError) throw productError;
      if (!product) return null;

      const { data: stock, error: stockError } = await supabase
        .from('product_stock')
        .select('*')
        .eq('product_id', id);

      if (stockError) throw stockError;

      return {
        ...product,
        stock: stock || [],
      };
    },
    enabled: !!id,
  });
}
