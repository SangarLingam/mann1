import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Truck, CheckCircle2, MapPin, Phone, Mail, User } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const customerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  phone: z.string().trim().min(10, 'Phone must be at least 10 digits').max(15),
  address: z.string().trim().min(10, 'Please enter a complete address').max(500),
  city: z.string().trim().min(2, 'City is required').max(100),
  state: z.string().trim().min(2, 'State is required').max(100),
  pincode: z.string().trim().min(6, 'Pincode must be 6 digits').max(6),
  notes: z.string().max(500).optional()
});

type CustomerDetails = z.infer<typeof customerSchema>;

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerDetails, string>>>({});
  const [orderNumber, setOrderNumber] = useState<string>('');
  
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    notes: ''
  });

  const handleInputChange = (field: keyof CustomerDetails, value: string) => {
    setCustomerDetails(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const result = customerSchema.safeParse(customerDetails);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CustomerDetails, string>> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof CustomerDetails;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const fullAddress = `${customerDetails.address}, ${customerDetails.city}, ${customerDetails.state} - ${customerDetails.pincode}`;
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_type: 'online' as const,
          status: 'pending' as const,
          subtotal: totalPrice,
          shipping: 0,
          total: totalPrice,
          customer_name: customerDetails.name,
          customer_email: customerDetails.email,
          customer_phone: customerDetails.phone,
          customer_address: fullAddress,
          notes: customerDetails.notes || null
        } as any)
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        size: item.size as 'S' | 'M' | 'L' | 'XL' | 'XXL',
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: (order) => {
      setOrderNumber(order.order_number);
      clearCart();
      setStep(3);
      toast({
        title: 'Order Placed Successfully!',
        description: `Your order ${order.order_number} has been confirmed.`
      });
    },
    onError: (error) => {
      toast({
        title: 'Order Failed',
        description: 'Unable to place your order. Please try again.',
        variant: 'destructive'
      });
      console.error('Order error:', error);
    }
  });

  const handleContinue = () => {
    if (step === 1) {
      if (validateForm()) {
        setStep(2);
      }
    } else if (step === 2) {
      createOrderMutation.mutate();
    }
  };

  if (items.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-3xl font-bold mb-4">Your cart is empty</h1>
            <Link to="/collection">
              <Button variant="hero">Continue Shopping</Button>
            </Link>
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
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-12">
            {[
              { num: 1, label: 'Details', icon: User },
              { num: 2, label: 'Review', icon: CreditCard },
              { num: 3, label: 'Confirmation', icon: CheckCircle2 }
            ].map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className={`flex items-center gap-2 ${step >= s.num ? 'text-accent' : 'text-muted-foreground'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step >= s.num ? 'bg-accent text-accent-foreground' : 'bg-muted'
                  }`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium hidden sm:block">{s.label}</span>
                </div>
                {i < 2 && (
                  <div className={`w-12 sm:w-24 h-0.5 mx-2 ${step > s.num ? 'bg-accent' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>

          {step === 3 ? (
            /* Order Confirmation */
            <div className="max-w-lg mx-auto text-center animate-fade-up">
              <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-accent" />
              </div>
              <h1 className="font-display text-4xl font-bold mb-4">Order Confirmed!</h1>
              <p className="text-muted-foreground mb-2">Thank you for your purchase</p>
              <p className="font-mono text-lg mb-8">Order Number: <span className="font-bold">{orderNumber}</span></p>
              
              <Card className="text-left mb-8">
                <CardHeader>
                  <CardTitle className="text-lg">Delivery Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>{customerDetails.name}</strong></p>
                  <p className="text-muted-foreground">{customerDetails.address}</p>
                  <p className="text-muted-foreground">{customerDetails.city}, {customerDetails.state} - {customerDetails.pincode}</p>
                  <p className="text-muted-foreground">{customerDetails.phone}</p>
                  <p className="text-muted-foreground">{customerDetails.email}</p>
                </CardContent>
              </Card>

              <div className="flex gap-4 justify-center">
                <Link to="/">
                  <Button variant="outline">Back to Home</Button>
                </Link>
                <Link to="/collection">
                  <Button variant="hero">Continue Shopping</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Section */}
              <div className="lg:col-span-2">
                {step === 1 && (
                  <Card className="animate-fade-in">
                    <CardHeader>
                      <CardTitle className="font-display flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-accent" />
                        Shipping Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name *</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="name"
                              placeholder="John Doe"
                              value={customerDetails.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              className={`pl-10 ${errors.name ? 'border-destructive' : ''}`}
                            />
                          </div>
                          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="john@example.com"
                              value={customerDetails.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                            />
                          </div>
                          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            placeholder="+91 9876543210"
                            value={customerDetails.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className={`pl-10 ${errors.phone ? 'border-destructive' : ''}`}
                          />
                        </div>
                        {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Street Address *</Label>
                        <Textarea
                          id="address"
                          placeholder="House/Flat No, Building Name, Street, Landmark"
                          value={customerDetails.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          className={errors.address ? 'border-destructive' : ''}
                        />
                        {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            placeholder="Mumbai"
                            value={customerDetails.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            className={errors.city ? 'border-destructive' : ''}
                          />
                          {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State *</Label>
                          <Input
                            id="state"
                            placeholder="Maharashtra"
                            value={customerDetails.state}
                            onChange={(e) => handleInputChange('state', e.target.value)}
                            className={errors.state ? 'border-destructive' : ''}
                          />
                          {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pincode">Pincode *</Label>
                          <Input
                            id="pincode"
                            placeholder="400001"
                            value={customerDetails.pincode}
                            onChange={(e) => handleInputChange('pincode', e.target.value)}
                            className={errors.pincode ? 'border-destructive' : ''}
                          />
                          {errors.pincode && <p className="text-sm text-destructive">{errors.pincode}</p>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Order Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Any special instructions for delivery..."
                          value={customerDetails.notes}
                          onChange={(e) => handleInputChange('notes', e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {step === 2 && (
                  <div className="space-y-6 animate-fade-in">
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-display flex items-center gap-2">
                          <Truck className="h-5 w-5 text-accent" />
                          Delivery Address
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium">{customerDetails.name}</p>
                        <p className="text-muted-foreground">{customerDetails.address}</p>
                        <p className="text-muted-foreground">{customerDetails.city}, {customerDetails.state} - {customerDetails.pincode}</p>
                        <p className="text-muted-foreground mt-2">{customerDetails.phone}</p>
                        <p className="text-muted-foreground">{customerDetails.email}</p>
                        <Button variant="link" className="p-0 h-auto mt-2" onClick={() => setStep(1)}>
                          Edit Address
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="font-display">Order Items</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {items.map((item) => (
                          <div key={`${item.product.id}-${item.size}`} className="flex gap-4 p-3 bg-muted/50 rounded-lg">
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-16 h-20 rounded object-cover"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{item.product.name}</p>
                              <p className="text-sm text-muted-foreground">Size: {item.size} | Qty: {item.quantity}</p>
                            </div>
                            <p className="font-semibold">₹{(item.product.price * item.quantity).toLocaleString()}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24 shadow-soft">
                  <CardHeader>
                    <CardTitle className="font-display">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={`${item.product.id}-${item.size}`} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.product.name} ({item.size}) × {item.quantity}
                          </span>
                          <span>₹{(item.product.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-border pt-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{totalPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="text-accent">Free</span>
                      </div>
                    </div>
                    
                    <div className="border-t border-border pt-4">
                      <div className="flex justify-between">
                        <span className="font-semibold">Total</span>
                        <span className="font-display text-2xl font-bold">₹{totalPrice.toLocaleString()}</span>
                      </div>
                    </div>

                    <Button
                      variant="hero"
                      className="w-full"
                      size="lg"
                      onClick={handleContinue}
                      disabled={createOrderMutation.isPending}
                    >
                      {createOrderMutation.isPending ? 'Processing...' : step === 1 ? 'Continue to Review' : 'Place Order'}
                    </Button>

                    {step === 2 && (
                      <Button variant="outline" className="w-full" onClick={() => setStep(1)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Details
                      </Button>
                    )}

                    <p className="text-xs text-center text-muted-foreground">
                      By placing this order, you agree to our Terms of Service
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
