import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingBag, Heart, Share2, Check } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { products } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-32 text-center">
          <h1 className="font-display text-3xl font-bold mb-4">Product Not Found</h1>
          <Link to="/collection">
            <Button variant="gold">Back to Collection</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const selectedSizeStock = product.sizes.find((s) => s.size === selectedSize);
  const maxQuantity = selectedSizeStock?.quantity || 0;
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (quantity > maxQuantity) {
      toast.error('Not enough stock available');
      return;
    }
    addToCart(product, selectedSize, quantity);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <Link
            to="/collection"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Collection
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Image */}
            <div className="relative aspect-square bg-muted rounded-2xl overflow-hidden animate-fade-in">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {discount > 0 && (
                <Badge className="absolute top-4 left-4 bg-gold text-charcoal text-lg px-4 py-2">
                  -{discount}% OFF
                </Badge>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6 animate-slide-in-right">
              <div>
                <span className="text-gold text-sm font-medium tracking-widest uppercase">
                  {product.category}
                </span>
                <h1 className="font-display text-4xl font-bold mt-2">{product.name}</h1>
              </div>

              <p className="text-muted-foreground text-lg">{product.description}</p>

              {/* Combo Details */}
              <div className="space-y-3 p-4 bg-secondary rounded-xl">
                <h3 className="font-semibold">Combo Includes:</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-gold mt-0.5" />
                    <div>
                      <span className="font-medium">Pant:</span>
                      <span className="text-muted-foreground ml-2">{product.pantDetails}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-gold mt-0.5" />
                    <div>
                      <span className="font-medium">Shirt:</span>
                      <span className="text-muted-foreground ml-2">{product.shirtDetails}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-4">
                <span className="font-display text-4xl font-bold">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span className="text-muted-foreground line-through text-xl">
                    ₹{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Size Selection */}
              <div>
                <label className="block font-medium mb-3">Select Size</label>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size.size}
                      onClick={() => size.quantity > 0 && setSelectedSize(size.size)}
                      disabled={size.quantity === 0}
                      className={`w-14 h-14 rounded-lg border-2 font-medium transition-all ${
                        selectedSize === size.size
                          ? 'border-gold bg-gold text-charcoal'
                          : size.quantity > 0
                          ? 'border-border hover:border-gold'
                          : 'border-border/50 text-muted-foreground/50 cursor-not-allowed line-through'
                      }`}
                    >
                      {size.size}
                    </button>
                  ))}
                </div>
                {selectedSizeStock && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedSizeStock.quantity} items in stock
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="block font-medium mb-3">Quantity</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                      disabled={quantity >= maxQuantity || !selectedSize}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button
                  variant="hero"
                  size="xl"
                  className="flex-1"
                  onClick={handleAddToCart}
                >
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button variant="outline" size="xl">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="xl">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
