'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import dynamic from 'next/dynamic';

const CustomerLayout = dynamic(() => import('@/components/customer/CustomerLayout'), {
  ssr: false,
});

export default function TokoPage() {
  const { navigate } = useAppStore();
  const initialSyncDone = useRef(false);

  // Sync URL params ke store - hanya sekali saat mount
  useEffect(() => {
    if (initialSyncDone.current) return;
    initialSyncDone.current = true;

    // Toko mode: set view berdasarkan URL param
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('v');
    const idParam = params.get('id');

    if (viewParam === 'search') {
      const categoryId = params.get('categoryId');
      navigate('search', categoryId ? { categoryId } : undefined);
    } else if (viewParam === 'wishlist') {
      navigate('wishlist');
    } else if (viewParam === 'cart') {
      navigate('cart');
    } else if (viewParam === 'product' && idParam) {
      navigate('product', { id: idParam });
    } else if (viewParam === 'checkout') {
      navigate('checkout');
    } else if (viewParam === 'order-success') {
      navigate('order-success');
    } else {
      navigate('home');
    }
  }, []);

  return <CustomerLayout isStoreMode />;
}
