import { useState, useRef } from 'react';
import { Search, Plus, Minus, Trash2, Printer, ShoppingCart, CreditCard, Banknote, Receipt, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
  image: string;
}

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
}

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const;

export function POSModule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({ name: '', phone: '', email: '' });
  const [lastOrder, setLastOrder] = useState<{ orderNumber: string; items: CartItem[]; total: number } | null>(null);

  // Fetch products with stock
  const { data: products, isLoading } = useQuery({
    queryKey: ['pos-products'],
    queryFn: async () => {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (productsError) throw productsError;

      const { data: stockData, error: stockError } = await supabase
        .from('product_stock')
        .select('*');

      if (stockError) throw stockError;

      return productsData.map(product => ({
        ...product,
        stock: stockData.filter(s => s.product_id === product.id)
      }));
    }
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_type: 'offline' as const,
          status: 'delivered' as const,
          subtotal,
          shipping: 0,
          total: subtotal,
          customer_name: customerInfo.name || 'Walk-in Customer',
          customer_phone: customerInfo.phone || null,
          customer_email: customerInfo.email || null,
          notes: `Payment: ${paymentMethod.toUpperCase()}`
        } as any)
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        size: item.size as 'S' | 'M' | 'L' | 'XL' | 'XXL',
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: (order) => {
      setLastOrder({
        orderNumber: order.order_number,
        items: [...cart],
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
      });
      setCart([]);
      setCustomerInfo({ name: '', phone: '', email: '' });
      setIsCheckoutOpen(false);
      setIsReceiptOpen(true);
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({
        title: 'Order Completed',
        description: `Order ${order.order_number} has been created successfully.`
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create order. Please try again.',
        variant: 'destructive'
      });
      console.error('Order error:', error);
    }
  });

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: any) => {
    const stockItem = product.stock.find((s: any) => s.size === selectedSize);
    const currentInCart = cart.find(item => item.productId === product.id && item.size === selectedSize);
    const currentQty = currentInCart?.quantity || 0;
    
    if (!stockItem || stockItem.quantity <= currentQty) {
      toast({
        title: 'Out of Stock',
        description: `Size ${selectedSize} is not available for this product.`,
        variant: 'destructive'
      });
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id && item.size === selectedSize);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id && item.size === selectedSize
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        price: product.price,
        size: selectedSize,
        quantity: 1,
        image: product.image_url || '/placeholder.svg'
      }];
    });
  };

  const updateCartQuantity = (productId: string, size: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId && item.size === size) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string, size: string) => {
    setCart(prev => prev.filter(item => !(item.productId === productId && item.size === size)));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { border-top: 2px dashed #000; margin-top: 10px; padding-top: 10px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading products...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      {/* Product Grid */}
      <div className="lg:col-span-2 flex flex-col">
        <div className="mb-4 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedSize} onValueChange={setSelectedSize}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIZES.map(size => (
                <SelectItem key={size} value={size}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto flex-1 pb-4">
          {filteredProducts?.map(product => {
            const stockForSize = product.stock.find((s: any) => s.size === selectedSize);
            const available = stockForSize?.quantity || 0;
            
            return (
              <Card
                key={product.id}
                className="p-3 cursor-pointer hover:shadow-elevated transition-all hover:-translate-y-1"
                onClick={() => addToCart(product)}
              >
                <div className="aspect-square bg-muted rounded-lg mb-2 overflow-hidden">
                  <img
                    src={product.image_url || '/placeholder.svg'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-medium text-sm truncate">{product.name}</h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-bold text-accent">₹{product.price.toLocaleString()}</span>
                  <Badge variant={available > 0 ? 'secondary' : 'destructive'} className="text-xs">
                    {available > 0 ? `${available} left` : 'Out'}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Cart */}
      <div className="bg-card rounded-xl p-4 flex flex-col shadow-soft">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
          <ShoppingCart className="h-5 w-5 text-accent" />
          <h2 className="font-display text-xl font-semibold">Current Sale</h2>
          <Badge variant="secondary" className="ml-auto">{cart.length} items</Badge>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {cart.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Cart is empty</p>
              <p className="text-sm">Click products to add</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={`${item.productId}-${item.size}`} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Size: {item.size}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => updateCartQuantity(item.productId, item.size, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => updateCartQuantity(item.productId, item.size, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">₹{(item.price * item.quantity).toLocaleString()}</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive"
                    onClick={() => removeFromCart(item.productId, item.size)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border pt-4 mt-4 space-y-3">
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span className="font-display text-2xl">₹{cartTotal.toLocaleString()}</span>
          </div>
          <Button
            variant="hero"
            className="w-full"
            size="lg"
            disabled={cart.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Complete Sale
          </Button>
          {cart.length > 0 && (
            <Button variant="outline" className="w-full" onClick={() => setCart([])}>
              Clear Cart
            </Button>
          )}
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Complete Sale</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer Name (Optional)</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Walk-in Customer"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone (Optional)</Label>
              <Input
                placeholder="Phone number"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('cash')}
                  className="h-16"
                >
                  <Banknote className="h-6 w-6 mr-2" />
                  Cash
                </Button>
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('card')}
                  className="h-16"
                >
                  <CreditCard className="h-6 w-6 mr-2" />
                  Card
                </Button>
              </div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount</span>
                <span className="font-display text-2xl">₹{cartTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>Cancel</Button>
            <Button
              variant="hero"
              onClick={() => createOrderMutation.mutate()}
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Receipt
            </DialogTitle>
          </DialogHeader>
          <div ref={receiptRef} className="bg-background p-4 rounded-lg border">
            <div className="header text-center border-b-2 border-dashed pb-3 mb-3">
              <h3 className="font-display text-xl font-bold">Mann's Collection</h3>
              <p className="text-sm text-muted-foreground">Premium Men's Fashion</p>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
              </p>
              {lastOrder && (
                <p className="font-mono text-sm mt-1">#{lastOrder.orderNumber}</p>
              )}
            </div>
            {lastOrder?.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm py-1">
                <span>{item.name} ({item.size}) x{item.quantity}</span>
                <span>₹{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t-2 border-dashed mt-3 pt-3">
              <div className="flex justify-between font-bold">
                <span>TOTAL</span>
                <span>₹{lastOrder?.total.toLocaleString()}</span>
              </div>
            </div>
            <div className="text-center mt-4 text-xs text-muted-foreground">
              <p>Thank you for shopping with us!</p>
              <p>Visit again soon</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReceiptOpen(false)}>Close</Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
