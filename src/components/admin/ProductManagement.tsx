import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Upload, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductCategory = Database['public']['Enums']['product_category'];
type ProductSize = Database['public']['Enums']['product_size'];

const CATEGORIES: ProductCategory[] = ['Formal', 'Business Casual', 'Casual'];
const SIZES: ProductSize[] = ['S', 'M', 'L', 'XL', 'XXL'];

interface ProductWithStock extends Product {
  stock: { size: ProductSize; quantity: number }[];
}

export default function ProductManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithStock | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      const { data: stockData, error: stockError } = await supabase
        .from('product_stock')
        .select('*');

      if (stockError) throw stockError;

      return productsData.map(product => ({
        ...product,
        stock: stockData
          .filter(s => s.product_id === product.id)
          .map(s => ({ size: s.size, quantity: s.quantity }))
      })) as ProductWithStock[];
    }
  });

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const createProductMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      let imageUrl = formData.get('image_url') as string;
      
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const productData: ProductInsert = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        pant_details: formData.get('pant_details') as string,
        shirt_details: formData.get('shirt_details') as string,
        price: Number(formData.get('price')),
        original_price: formData.get('original_price') ? Number(formData.get('original_price')) : null,
        category: formData.get('category') as ProductCategory,
        featured: formData.get('featured') === 'true',
        image_url: imageUrl || null,
      };

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (productError) throw productError;

      // Create stock entries for all sizes
      const stockEntries = SIZES.map(size => ({
        product_id: product.id,
        size,
        quantity: Number(formData.get(`stock_${size}`) || 0)
      }));

      const { error: stockError } = await supabase
        .from('product_stock')
        .insert(stockEntries);

      if (stockError) throw stockError;

      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: 'Product created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error creating product', description: error.message, variant: 'destructive' });
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      let imageUrl = formData.get('image_url') as string;
      
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const productData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        pant_details: formData.get('pant_details') as string,
        shirt_details: formData.get('shirt_details') as string,
        price: Number(formData.get('price')),
        original_price: formData.get('original_price') ? Number(formData.get('original_price')) : null,
        category: formData.get('category') as ProductCategory,
        featured: formData.get('featured') === 'true',
        image_url: imageUrl || null,
      };

      const { error: productError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id);

      if (productError) throw productError;

      // Update stock entries
      for (const size of SIZES) {
        const quantity = Number(formData.get(`stock_${size}`) || 0);
        const { error: stockError } = await supabase
          .from('product_stock')
          .upsert({
            product_id: id,
            size,
            quantity
          }, { onConflict: 'product_id,size' });

        if (stockError) throw stockError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: 'Product updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating product', description: error.message, variant: 'destructive' });
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete stock entries
      const { error: stockError } = await supabase
        .from('product_stock')
        .delete()
        .eq('product_id', id);

      if (stockError) throw stockError;

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: 'Product deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting product', description: error.message, variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, formData });
    } else {
      createProductMutation.mutate(formData);
    }
  };

  const openEditDialog = (product: ProductWithStock) => {
    setEditingProduct(product);
    setImagePreview(product.image_url);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Products</h2>
          <p className="text-muted-foreground">{products?.length || 0} products</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" name="name" defaultValue={editingProduct?.name} required />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" defaultValue={editingProduct?.description || ''} />
                </div>

                <div>
                  <Label htmlFor="pant_details">Pant Details</Label>
                  <Textarea id="pant_details" name="pant_details" defaultValue={editingProduct?.pant_details} required />
                </div>

                <div>
                  <Label htmlFor="shirt_details">Shirt Details</Label>
                  <Textarea id="shirt_details" name="shirt_details" defaultValue={editingProduct?.shirt_details} required />
                </div>

                <div>
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input id="price" name="price" type="number" defaultValue={editingProduct?.price} required />
                </div>

                <div>
                  <Label htmlFor="original_price">Original Price (₹)</Label>
                  <Input id="original_price" name="original_price" type="number" defaultValue={editingProduct?.original_price || ''} />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue={editingProduct?.category || 'Casual'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="featured">Featured</Label>
                  <Select name="featured" defaultValue={editingProduct?.featured ? 'true' : 'false'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label>Product Image</Label>
                  <div className="flex items-center gap-4 mt-2">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg" />
                    ) : (
                      <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <Label htmlFor="image-upload" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors">
                          <Upload className="h-4 w-4" />
                          <span>Upload Image</span>
                        </div>
                      </Label>
                      <Input type="hidden" name="image_url" value={editingProduct?.image_url || ''} />
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <Label>Stock by Size</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {SIZES.map(size => {
                      const stockItem = editingProduct?.stock.find(s => s.size === size);
                      return (
                        <div key={size}>
                          <Label className="text-xs text-muted-foreground">{size}</Label>
                          <Input
                            name={`stock_${size}`}
                            type="number"
                            min="0"
                            defaultValue={stockItem?.quantity || 0}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="gold"
                  disabled={createProductMutation.isPending || updateProductMutation.isPending}
                >
                  {(createProductMutation.isPending || updateProductMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Product</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Category</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Price</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Stock</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products?.map((product) => {
                const totalStock = product.stock.reduce((s, item) => s + item.quantity, 0);
                return (
                  <tr key={product.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden">
                          <img
                            src={product.image_url || '/placeholder.svg'}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-medium">{product.name}</span>
                          {product.featured && (
                            <span className="ml-2 text-xs bg-gold/20 text-gold px-2 py-0.5 rounded">Featured</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{product.category}</td>
                    <td className="px-6 py-4">₹{Number(product.price).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium',
                        totalStock > 20 ? 'bg-green-100 text-green-700' :
                        totalStock > 5 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      )}>
                        {totalStock} units
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteProductMutation.mutate(product.id)}
                          disabled={deleteProductMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
