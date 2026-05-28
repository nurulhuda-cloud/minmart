'use client';

import { useState, useEffect } from 'react';
import { useAppStore, type View } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Warehouse,
  Wallet,
  Image,
  Tag,
  Settings,
  LogOut,
  Menu,
  Store,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import AdminLoginView from './AdminLoginView';
import AdminDashboardView from './AdminDashboardView';
import AdminProductsView from './AdminProductsView';
import AdminOrdersView from './AdminOrdersView';
import AdminStockView from './AdminStockView';
import AdminFinanceView from './AdminFinanceView';
import AdminBannersView from './AdminBannersView';
import AdminCategoriesView from './AdminCategoriesView';
import AdminSettingsView from './AdminSettingsView';

interface MenuItem {
  label: string;
  icon: typeof LayoutDashboard;
  view: View;
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, view: 'admin-dashboard' },
  { label: 'Produk', icon: Package, view: 'admin-products' },
  { label: 'Pesanan', icon: ShoppingBag, view: 'admin-orders' },
  { label: 'Stok', icon: Warehouse, view: 'admin-stock' },
  { label: 'Keuangan', icon: Wallet, view: 'admin-finance' },
  { label: 'Banner', icon: Image, view: 'admin-banners' },
  { label: 'Kategori', icon: Tag, view: 'admin-categories' },
  { label: 'Pengaturan', icon: Settings, view: 'admin-settings' },
];

function SidebarContent({
  currentView,
  onNavigate,
  onLogout,
  onOpenStore,
  onCopyStoreLink,
  storeName,
}: {
  currentView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  onOpenStore: () => void;
  onCopyStoreLink: () => void;
  storeName: string;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo / Store Name */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
          <Store className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-lg">{storeName}</h2>
          <p className="text-xs text-gray-500">Manajemen Toko</p>
        </div>
      </div>

      <Separator />

      {/* Navigation Menu */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={cn(
                    'w-5 h-5',
                    isActive ? 'text-emerald-600' : 'text-gray-400'
                  )}
                />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Store Link Section */}
        <Separator className="my-4" />
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold px-1">Link Toko</p>
          <button
            onClick={onOpenStore}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors border border-emerald-200"
          >
            <ExternalLink className="w-5 h-5 text-emerald-500" />
            Buka Toko
          </button>
          <button
            onClick={onCopyStoreLink}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <Copy className="w-5 h-5 text-gray-400" />
            Salin Link Toko
          </button>
        </div>
      </ScrollArea>

      <Separator />

      {/* Logout */}
      <div className="p-3">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5 text-gray-400" />
          Keluar
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { currentView, navigate, isAuthenticated, logout, admin } = useAppStore();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [storeSlug, setStoreSlug] = useState('toko');
  const [storeName, setStoreNameState] = useState('SehatMart');

  // Fetch store settings for link generation
  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.storeSlug) setStoreSlug(data.storeSlug);
        if (data?.storeName) setStoreNameState(data.storeName);
      })
      .catch(() => {});
  }, []);

  // If not authenticated, show login
  if (!isAuthenticated) {
    return <AdminLoginView />;
  }

  const handleNavigate = (view: View) => {
    navigate(view);
    setSidebarOpen(false);
  };

  const handleOpenStore = () => {
    window.open(`/${storeSlug}`, '_blank');
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('admin-login');
  };

  const handleCopyStoreLink = () => {
    const storeUrl = new URL(`/${storeSlug}`, window.location.origin);
    navigator.clipboard.writeText(storeUrl.toString()).then(() => {
      toast({ title: 'Link toko berhasil disalin!', description: storeUrl.toString() });
    }).catch(() => {
      toast({ title: 'Gagal menyalin link', variant: 'destructive' });
    });
    setSidebarOpen(false);
  };

  // Render content based on current view
  const renderContent = () => {
    switch (currentView) {
      case 'admin-dashboard':
        return <AdminDashboardView />;
      case 'admin-products':
        return <AdminProductsView />;
      case 'admin-orders':
        return <AdminOrdersView />;
      case 'admin-stock':
        return <AdminStockView />;
      case 'admin-finance':
        return <AdminFinanceView />;
      case 'admin-banners':
        return <AdminBannersView />;
      case 'admin-categories':
        return <AdminCategoriesView />;
      case 'admin-settings':
        return <AdminSettingsView />;
      default:
        return <AdminDashboardView />;
    }
  };

  // Get page title
  const getPageTitle = () => {
    const item = menuItems.find((m) => m.view === currentView);
    return item?.label || 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
        <SidebarContent
          currentView={currentView}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          onOpenStore={handleOpenStore}
          onCopyStoreLink={handleCopyStoreLink}
          storeName={storeName}
        />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
          <SidebarContent
            currentView={currentView}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            onOpenStore={handleOpenStore}
            onCopyStoreLink={handleCopyStoreLink}
            storeName={storeName}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <h1 className="font-semibold text-gray-900">{getPageTitle()}</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenStore}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="text-xs">Toko</span>
            </Button>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenStore}
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Buka Toko
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyStoreLink}
              className="text-gray-500 hover:text-gray-700 gap-2"
            >
              <Copy className="w-4 h-4" />
              Salin Link
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {admin?.name || admin?.email || 'Admin'}
              </span>
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-emerald-700">
                  {(admin?.name || 'A').charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 65px)' }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
