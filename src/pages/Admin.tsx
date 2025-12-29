import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Boxes,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Package, label: 'Products' },
  { icon: ShoppingCart, label: 'Orders' },
  { icon: Users, label: 'Customers' },
  { icon: BarChart3, label: 'Reports' },
  { icon: Settings, label: 'Settings' },
];

export default function Admin() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { data: products, isLoading: productsLoading } = useProducts();
  const { user, isLoading: authLoading, isStaff, signOut } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated or not staff
  useEffect(() => {
    if (!authLoading && (!user || !isStaff)) {
      navigate('/admin/auth');
    }
  }, [user, authLoading, isStaff, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/auth');
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  // Don't render if not authorized (will redirect)
  if (!user || !isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold mx-auto mb-4" />
          <p className="text-muted-foreground">Checking access permissions...</p>
        </div>
      </div>
    );
  }

  const totalStock = products?.reduce(
    (sum, p) => sum + p.stock.reduce((s, size) => s + size.quantity, 0),
    0
  ) || 0;

  const lowStockCount = products?.filter(p => {
    const stock = p.stock.reduce((s, size) => s + size.quantity, 0);
    return stock > 0 && stock < 20;
  }).length || 0;

  const stats = [
    {
      label: 'Total Revenue',
      value: '₹4,52,890',
      change: '+12.5%',
      trend: 'up' as const,
      icon: DollarSign,
    },
    {
      label: 'Total Orders',
      value: '1,247',
      change: '+8.2%',
      trend: 'up' as const,
      icon: ShoppingCart,
    },
    {
      label: 'Products',
      value: (products?.length || 0).toString(),
      change: '+2',
      trend: 'up' as const,
      icon: Package,
    },
    {
      label: 'Low Stock Items',
      value: lowStockCount.toString(),
      change: '-2',
      trend: 'down' as const,
      icon: Boxes,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-charcoal text-cream z-50 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-bold">MANN</span>
              <span className="text-gold text-xs tracking-widest">ADMIN</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-cream hover:bg-charcoal-light"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-6">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              className={cn(
                'w-full flex items-center gap-4 px-6 py-3 text-cream/70 hover:text-cream hover:bg-charcoal-light transition-colors',
                item.active && 'text-cream bg-charcoal-light border-r-2 border-gold'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-charcoal-light space-y-2">
          <Link to="/">
            <button className="w-full flex items-center gap-4 px-2 py-3 text-cream/70 hover:text-cream transition-colors">
              <LogOut className="h-5 w-5" />
              {sidebarOpen && <span>Back to Store</span>}
            </button>
          </Link>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-4 px-2 py-3 text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-20'
        )}
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user.email}</p>
            </div>
            <Button variant="gold">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="bg-card rounded-xl p-6 shadow-soft animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-gold" />
                  </div>
                  <span
                    className={cn(
                      'flex items-center text-sm font-medium',
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-500'
                    )}
                  >
                    {stat.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    {stat.change}
                  </span>
                </div>
                <p className="font-display text-2xl font-bold">{stat.value}</p>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Products Table */}
          <div className="bg-card rounded-xl shadow-soft overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="font-display text-xl font-semibold">Products</h2>
              <p className="text-muted-foreground text-sm">
                {products?.length || 0} products • {totalStock} total units in stock
              </p>
            </div>
            
            {productsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                        Product
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                        Category
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                        Price
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                        Stock
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products?.map((product) => {
                      const stock = product.stock.reduce((s, size) => s + size.quantity, 0);
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
                              <span className="font-medium">{product.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {product.category}
                          </td>
                          <td className="px-6 py-4">₹{Number(product.price).toLocaleString()}</td>
                          <td className="px-6 py-4">{stock} units</td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                'px-3 py-1 rounded-full text-xs font-medium',
                                stock > 20
                                  ? 'bg-green-100 text-green-700'
                                  : stock > 5
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              )}
                            >
                              {stock > 20 ? 'In Stock' : stock > 5 ? 'Low Stock' : 'Critical'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
