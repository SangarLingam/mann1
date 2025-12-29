import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';

export default function Cart() {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-16">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-md mx-auto">
              <ShoppingBag className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
              <h1 className="font-display text-3xl font-bold mb-4">Your Cart is Empty</h1>
              <p className="text-muted-foreground mb-8">
                Looks like you haven't added any combos to your cart yet.
              </p>
              <Link to="/collection">
                <Button variant="hero" size="lg">
                  Start Shopping
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl font-bold mb-8">Shopping Cart</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.size}`}
                  className="flex gap-4 p-4 bg-card rounded-xl shadow-soft animate-fade-in"
                >
                  {/* Image */}
                  <div className="w-24 h-32 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.product.id}`}>
                      <h3 className="font-display font-semibold hover:text-gold transition-colors">
                        {item.product.name}
                      </h3>
                    </Link>
                    <p className="text-muted-foreground text-sm mt-1">
                      Size: {item.size}
                    </p>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center border border-border rounded-lg">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.product.id, item.size)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="font-semibold">
                      ₹{(item.product.price * item.quantity).toLocaleString()}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-muted-foreground text-sm">
                        ₹{item.product.price.toLocaleString()} each
                      </p>
                    )}
                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={clearCart} className="mt-4">
                Clear Cart
              </Button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl p-6 shadow-soft sticky top-24">
                <h2 className="font-display text-xl font-semibold mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-gold">Free</span>
                  </div>
                  <div className="border-t border-border pt-4 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-display text-2xl font-bold">
                      ₹{totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                <Button variant="hero" className="w-full" size="lg">
                  Proceed to Checkout
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>

                <p className="text-muted-foreground text-xs text-center mt-4">
                  Taxes calculated at checkout
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
