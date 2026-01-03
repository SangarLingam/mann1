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
import ProductManagement from '@/components/admin/ProductManagement';
import OrderManagement from '@/components/admin/OrderManagement';
import StaffManagement from '@/components/admin/StaffManagement';

type TabType = 'dashboard' | 'products' | 'orders' | 'staff' | 'reports' | 'settings';

const sidebarItems: { icon: typeof LayoutDashboard; label: string; tab: TabType }[] = [
  { icon: LayoutDashboard, label: 'Dashboard', tab: 'dashboard' },
  { icon: Package, label: 'Products', tab: 'products' },
  { icon: ShoppingCart, label: 'Orders', tab: 'orders' },
  { icon: Users, label: 'Staff', tab: 'staff' },
  { icon: BarChart3, label: 'Reports', tab: 'reports' },
  { icon: Settings, label: 'Settings', tab: 'settings' },
];

export default function Admin() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const { data: products, isLoading: productsLoading } = useProducts();
  const { user, isLoading: authLoading, isStaff, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && (!user || !isStaff)) {
      navigate('/admin/auth');
    }
  }, [user, authLoading, isStaff, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/auth');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

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

  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return <ProductManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'staff':
        return <StaffManagement />;
      case 'reports':
        return (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold mb-2">Reports Coming Soon</h3>
            <p className="text-muted-foreground">Sales analytics and reports will be available here.</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold mb-2">Settings</h3>
            <p className="text-muted-foreground">Store settings will be available here.</p>
          </div>
        );
      default:
        return (
          <>
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

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Button variant="outline" className="h-20" onClick={() => setActiveTab('products')}>
                <Package className="h-6 w-6 mr-2" />
                Manage Products
              </Button>
              <Button variant="outline" className="h-20" onClick={() => setActiveTab('orders')}>
                <ShoppingCart className="h-6 w-6 mr-2" />
                View Orders
              </Button>
              {isAdmin && (
                <Button variant="outline" className="h-20" onClick={() => setActiveTab('staff')}>
                  <Users className="h-6 w-6 mr-2" />
                  Manage Staff
                </Button>
              )}
            </div>

            {/* Products Table */}
            <div className="bg-card rounded-xl shadow-soft overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="font-display text-xl font-semibold">Recent Products</h2>
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
                        <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Product</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Category</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Price</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Stock</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products?.slice(0, 5).map((product) => {
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
                            <td className="px-6 py-4 text-muted-foreground">{product.category}</td>
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
          </>
        );
    }
  };

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
              onClick={() => setActiveTab(item.tab)}
              className={cn(
                'w-full flex items-center gap-4 px-6 py-3 text-cream/70 hover:text-cream hover:bg-charcoal-light transition-colors',
                activeTab === item.tab && 'text-cream bg-charcoal-light border-r-2 border-gold'
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
              <h1 className="font-display text-3xl font-bold capitalize">{activeTab}</h1>
              <p className="text-muted-foreground">
                Welcome back, {user.email} 
                {isAdmin && <span className="ml-2 text-gold">(Admin)</span>}
                {!isAdmin && isStaff && <span className="ml-2 text-blue-500">(Staff)</span>}
              </p>
            </div>
          </div>

          {renderContent()}
        </div>
      </main>
    </div>
  );
}
