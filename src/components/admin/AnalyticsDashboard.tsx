import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Package, Users, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['hsl(38, 70%, 50%)', 'hsl(220, 20%, 15%)', 'hsl(220, 15%, 45%)', 'hsl(40, 60%, 70%)'];

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Fetch orders data
  const { data: orders } = useQuery({
    queryKey: ['analytics-orders', dateRange],
    queryFn: async () => {
      const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name))')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  // Calculate metrics
  const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
  const totalOrders = orders?.length || 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const onlineOrders = orders?.filter(o => o.order_type === 'online').length || 0;
  const offlineOrders = orders?.filter(o => o.order_type === 'offline').length || 0;
  const onlineRevenue = orders?.filter(o => o.order_type === 'online').reduce((sum, o) => sum + Number(o.total), 0) || 0;
  const offlineRevenue = orders?.filter(o => o.order_type === 'offline').reduce((sum, o) => sum + Number(o.total), 0) || 0;

  // Revenue by day chart data
  const revenueByDay = orders?.reduce((acc: { [key: string]: { date: string; online: number; offline: number } }, order) => {
    const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!acc[date]) {
      acc[date] = { date, online: 0, offline: 0 };
    }
    if (order.order_type === 'online') {
      acc[date].online += Number(order.total);
    } else {
      acc[date].offline += Number(order.total);
    }
    return acc;
  }, {});

  const chartData = Object.values(revenueByDay || {});

  // Top selling products
  const productSales = orders?.flatMap(o => o.order_items || []).reduce((acc: { [key: string]: { name: string; quantity: number; revenue: number } }, item: any) => {
    const name = item.products?.name || 'Unknown';
    if (!acc[name]) {
      acc[name] = { name, quantity: 0, revenue: 0 };
    }
    acc[name].quantity += item.quantity;
    acc[name].revenue += Number(item.total_price);
    return acc;
  }, {});

  const topProducts = Object.values(productSales || {})
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Sales channel comparison
  const channelData = [
    { name: 'Online', value: onlineRevenue, orders: onlineOrders },
    { name: 'In-Store', value: offlineRevenue, orders: offlineOrders }
  ];

  // Order status breakdown
  const statusCounts = orders?.reduce((acc: { [key: string]: number }, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.entries(statusCounts || {}).map(([name, value]) => ({ name, value }));

  const stats = [
    {
      title: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      trend: '+12.5%',
      trendUp: true,
      color: 'text-accent'
    },
    {
      title: 'Total Orders',
      value: totalOrders.toString(),
      icon: ShoppingBag,
      trend: '+8.2%',
      trendUp: true,
      color: 'text-primary'
    },
    {
      title: 'Avg Order Value',
      value: `₹${avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: Package,
      trend: '+3.1%',
      trendUp: true,
      color: 'text-accent'
    },
    {
      title: 'Online vs Offline',
      value: `${onlineOrders}/${offlineOrders}`,
      icon: Users,
      trend: `${((onlineOrders / (totalOrders || 1)) * 100).toFixed(0)}% online`,
      trendUp: true,
      color: 'text-primary'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Sales Analytics</h2>
          <p className="text-muted-foreground">Track your business performance</p>
        </div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
          <SelectTrigger className="w-40">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <Badge variant={stat.trendUp ? 'secondary' : 'destructive'} className="flex items-center gap-1">
                  {stat.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stat.trend}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-muted-foreground text-sm">{stat.title}</p>
                <p className="font-display text-3xl font-bold mt-1">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display">Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(38, 70%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(38, 70%, 50%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOffline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(220, 20%, 15%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(220, 20%, 15%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="online" stroke="hsl(38, 70%, 50%)" fill="url(#colorOnline)" name="Online" />
                <Area type="monotone" dataKey="offline" stroke="hsl(220, 20%, 15%)" fill="url(#colorOffline)" name="In-Store" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales Channel Comparison */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display">Sales by Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {channelData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(value: number, name: string, props: any) => [
                    `₹${value.toLocaleString()} (${props.payload.orders} orders)`,
                    name
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display">Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={150} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? `₹${value.toLocaleString()}` : value,
                    name === 'revenue' ? 'Revenue' : 'Quantity'
                  ]}
                />
                <Bar dataKey="revenue" fill="hsl(38, 70%, 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display">Order Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusData.map((status, index) => (
                <div key={status.name} className="flex items-center gap-4">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ background: COLORS[index % COLORS.length] }}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="capitalize font-medium">{status.name.replace('_', ' ')}</span>
                      <span className="text-muted-foreground">{status.value} orders</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(status.value / totalOrders) * 100}%`,
                          background: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-display font-bold">{orders?.filter(o => o.status === 'delivered').length || 0}</p>
                  <p className="text-sm text-muted-foreground">Delivered</p>
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{orders?.filter(o => o.status === 'pending' || o.status === 'confirmed').length || 0}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
