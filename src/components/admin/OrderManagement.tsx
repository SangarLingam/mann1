import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderStatus = Database['public']['Enums']['order_status'];

const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrderManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, image_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({ title: 'Order status updated' });
    },
    onError: (error) => {
      toast({ title: 'Error updating status', description: error.message, variant: 'destructive' });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Orders</h2>
        <p className="text-muted-foreground">{orders?.length || 0} orders</p>
      </div>

      <div className="bg-card rounded-xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Order</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Customer</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Type</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Total</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders?.map((order) => (
                <tr key={order.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium font-mono text-sm">{order.order_number}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{order.customer_name || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">{order.customer_phone || order.customer_email || 'No contact'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={order.order_type === 'online' ? 'default' : 'secondary'}>
                      {order.order_type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-medium">₹{Number(order.total).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <Select
                      defaultValue={order.status}
                      onValueChange={(value) => updateStatusMutation.mutate({ id: order.id, status: value as OrderStatus })}
                    >
                      <SelectTrigger className={cn('w-32', statusColors[order.status])}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map(status => (
                          <SelectItem key={status} value={status} className="capitalize">
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-sm">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Order {order.order_number}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Customer</p>
                              <p className="font-medium">{order.customer_name || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Contact</p>
                              <p className="font-medium">{order.customer_phone || order.customer_email || 'N/A'}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-muted-foreground">Address</p>
                              <p className="font-medium">{order.customer_address || 'N/A'}</p>
                            </div>
                          </div>
                          
                          <div className="border-t pt-4">
                            <p className="text-sm text-muted-foreground mb-2">Items</p>
                            <div className="space-y-2">
                              {(order as any).order_items?.map((item: any) => (
                                <div key={item.id} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <img 
                                      src={item.products?.image_url || '/placeholder.svg'} 
                                      alt="" 
                                      className="w-10 h-10 rounded object-cover"
                                    />
                                    <div>
                                      <p className="font-medium text-sm">{item.products?.name}</p>
                                      <p className="text-xs text-muted-foreground">Size: {item.size} × {item.quantity}</p>
                                    </div>
                                  </div>
                                  <p className="font-medium">₹{Number(item.total_price).toLocaleString()}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="border-t pt-4 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Subtotal</span>
                              <span>₹{Number(order.subtotal).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Shipping</span>
                              <span>₹{Number(order.shipping || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-bold">
                              <span>Total</span>
                              <span>₹{Number(order.total).toLocaleString()}</span>
                            </div>
                          </div>

                          {order.notes && (
                            <div className="border-t pt-4">
                              <p className="text-sm text-muted-foreground">Notes</p>
                              <p className="text-sm">{order.notes}</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              ))}
              {(!orders || orders.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
