'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Home, Search, Heart, ShoppingCart, Share2, Store } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useAppStore, type View } from '@/lib/store';
import { storeSettings } from '@/lib/api';
import HomeView from './HomeView';
import SearchView from './SearchView';
import WishlistView from './WishlistView';
import CartView from './CartView';
import ProductDetailView from './ProductDetailView';
import CheckoutView from './CheckoutView';
import OrderSuccessView from './OrderSuccessView';

const navItems = [
  { view: 'home' as const, icon: Home, label: 'Beranda' },
  { view: 'search' as const, icon: Search, label: 'Cari' },
  { view: 'wishlist' as const, icon: Heart, label: 'Wishlist' },
  { view: 'cart' as const, icon: ShoppingCart, label: 'Keranjang' },
];

// View transition variants
const viewVariants = {
  enter: { opacity: 0, y: 8 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

export default function CustomerLayout({ isStoreMode }: { isStoreMode?: boolean }) {
  const { currentView, viewParams, navigate, getItemCount } = useAppStore();
  const [storeName, setStoreName] = useState('Toko Online');
  const [storeSlug, setStoreSlug] = useState('toko');
  const [isScrolled, setIsScrolled] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const cartItemCount = getItemCount();

  useEffect(() => {
    storeSettings.get().then((res) => {
      if (res.success && res.data) {
        setStoreName(res.data.storeName || 'Toko Online');
        setStoreSlug(res.data.storeSlug || 'toko');
      }
    });
  }, []);

  // Track scroll position for header shadow
  useEffect(() => {
    const mainEl = mainRef.current;
    if (!mainEl) return;

    const handleScroll = () => {
      setIsScrolled(mainEl.scrollTop > 8);
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigate = (view: View, params?: Record<string, string>) => {
    navigate(view, params);

    if (isStoreMode && typeof window !== 'undefined') {
      const url = new URL(window.location.href);

      if (view === 'home') {
        url.searchParams.delete('v');
        url.searchParams.delete('id');
        url.searchParams.delete('categoryId');
      } else if (view === 'product' && params?.id) {
        url.searchParams.set('v', 'product');
        url.searchParams.set('id', params.id);
      } else if (view === 'search') {
        url.searchParams.set('v', 'search');
        if (params?.categoryId) {
          url.searchParams.set('categoryId', params.categoryId);
        } else {
          url.searchParams.delete('categoryId');
        }
        url.searchParams.delete('id');
      } else if (view === 'cart') {
        url.searchParams.set('v', 'cart');
        url.searchParams.delete('id');
        url.searchParams.delete('categoryId');
      } else if (view === 'wishlist') {
        url.searchParams.set('v', 'wishlist');
        url.searchParams.delete('id');
        url.searchParams.delete('categoryId');
      } else if (view === 'checkout') {
        url.searchParams.set('v', 'checkout');
        url.searchParams.delete('id');
        url.searchParams.delete('categoryId');
      } else if (view === 'order-success') {
        url.searchParams.set('v', 'order-success');
        url.searchParams.delete('id');
        url.searchParams.delete('categoryId');
      }

      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleShareStore = async () => {
    if (typeof window === 'undefined') return;
    // Gunakan slug toko untuk link share
    const url = new URL(`/${storeSlug}`, window.location.origin).toString();

    if (navigator.share) {
      try {
        await navigator.share({
          title: storeName,
          text: `Cek ${storeName} sekarang!`,
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert('Link toko berhasil disalin!');
      });
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
      case 'store-preview':
        return <HomeView />;
      case 'search':
        return <SearchView />;
      case 'wishlist':
        return <WishlistView />;
      case 'cart':
        return <CartView />;
      case 'product':
        return <ProductDetailView productId={viewParams.id} />;
      case 'checkout':
        return <CheckoutView />;
      case 'order-success':
        return <OrderSuccessView />;
      default:
        return <HomeView />;
    }
  };

  const activeTab = (() => {
    if (currentView === 'home' || currentView === 'store-preview') return 'home';
    if (currentView === 'search') return 'search';
    if (currentView === 'wishlist') return 'wishlist';
    if (currentView === 'cart') return 'cart';
    return null;
  })();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-md mx-auto relative">
      {/* Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-gradient-to-r from-emerald-700 to-emerald-600 shadow-lg'
            : 'bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-md'
        }`}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Store Name & Branding */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Store className="size-[18px] text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-lg font-bold text-white truncate tracking-tight">
              {storeName}
            </h1>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={handleShareStore}
              className="p-2 rounded-xl hover:bg-white/15 active:bg-white/25 transition-all duration-150"
              aria-label="Bagikan Link Toko"
              title="Bagikan Link Toko"
            >
              <Share2 className="size-[18px] text-white/90" />
            </button>
            <button
              onClick={() => handleNavigate('search')}
              className="p-2 rounded-xl hover:bg-white/15 active:bg-white/25 transition-all duration-150"
              aria-label="Cari"
            >
              <Search className="size-[18px] text-white/90" />
            </button>
            <button
              onClick={() => handleNavigate('wishlist')}
              className="p-2 rounded-xl hover:bg-white/15 active:bg-white/25 transition-all duration-150 relative"
              aria-label="Wishlist"
            >
              <Heart className="size-[18px] text-white/90" />
            </button>
            <button
              onClick={() => handleNavigate('cart')}
              className="p-2 rounded-xl hover:bg-white/15 active:bg-white/25 transition-all duration-150 relative"
              aria-label="Keranjang"
            >
              <ShoppingCart className="size-[18px] text-white/90" />
              {cartItemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 bg-amber-400 text-emerald-900 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm"
                >
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </motion.span>
              )}
            </button>
          </div>
        </div>

        {/* Subtle bottom border glow */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent" />
      </header>

      {/* Main content with smooth transitions */}
      <main
        ref={mainRef}
        className="flex-1 pb-20 overflow-y-auto"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            variants={viewVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 z-50 pb-[env(safe-area-inset-bottom)]">
        <div className="relative flex items-center justify-around h-16">
          <LayoutGroup>
            {navItems.map((item) => {
              const isActive = activeTab === item.view;
              const Icon = item.icon;
              return (
                <button
                  key={item.view}
                  onClick={() => handleNavigate(item.view)}
                  className={`relative flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 min-w-[64px] rounded-xl transition-colors duration-200 ${
                    isActive ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Active background pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBg"
                      className="absolute inset-0 bg-emerald-50 rounded-xl"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}

                  {/* Icon container */}
                  <div className="relative z-10">
                    <motion.div
                      animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <Icon
                        className="size-[22px]"
                        strokeWidth={isActive ? 2.5 : 1.8}
                      />
                    </motion.div>
                    {item.view === 'cart' && cartItemCount > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5 shadow-sm">
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <motion.span
                    className="relative z-10 text-[10px] leading-tight"
                    animate={{
                      fontWeight: isActive ? 700 : 500,
                    }}
                    transition={{ duration: 0.15 }}
                  >
                    {item.label}
                  </motion.span>

                  {/* Active dot indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeDot"
                      className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-emerald-500"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </LayoutGroup>
        </div>
      </nav>
    </div>
  );
}
