import { Link } from 'react-router-dom';
import { ShoppingBag, Heart } from 'lucide-react';
import { ProductWithStock } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: ProductWithStock;
}

export function ProductCard({ product }: ProductCardProps) {
  const totalStock = product.stock.reduce((sum, s) => sum + s.quantity, 0);
  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const sizes: Array<'S' | 'M' | 'L' | 'XL' | 'XXL'> = ['S', 'M', 'L', 'XL', 'XXL'];

  return (
    <div className="group bg-card rounded-xl overflow-hidden shadow-soft hover-lift">
      {/* Image Container */}
      <div className="relative aspect-[3/4] bg-muted overflow-hidden">
        <img
          src={product.image_url || '/placeholder.svg'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {discount > 0 && (
            <Badge className="bg-gold text-charcoal font-semibold">
              -{discount}%
            </Badge>
          )}
          {totalStock < 10 && totalStock > 0 && (
            <Badge variant="destructive">
              Low Stock
            </Badge>
          )}
          {totalStock === 0 && (
            <Badge variant="destructive">
              Out of Stock
            </Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
          <Button variant="secondary" size="icon" className="rounded-full shadow-elevated">
            <Heart className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Add Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-charcoal/90 to-transparent opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
          <Link to={`/product/${product.id}`}>
            <Button variant="gold" className="w-full">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Quick View
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          {product.category}
        </span>
        <Link to={`/product/${product.id}`}>
          <h3 className="font-display text-lg font-semibold hover:text-gold transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">₹{Number(product.price).toLocaleString()}</span>
          {product.original_price && (
            <span className="text-muted-foreground line-through text-sm">
              ₹{Number(product.original_price).toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex gap-1 pt-1">
          {sizes.map((size) => {
            const sizeStock = product.stock.find((s) => s.size === size);
            const quantity = sizeStock?.quantity || 0;
            return (
              <span
                key={size}
                className={`text-xs px-2 py-1 rounded border ${
                  quantity > 0
                    ? 'border-border text-muted-foreground'
                    : 'border-border/50 text-muted-foreground/50 line-through'
                }`}
              >
                {size}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
