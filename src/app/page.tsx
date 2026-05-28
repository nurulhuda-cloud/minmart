'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import dynamic from 'next/dynamic';

const AdminLayout = dynamic(() => import('@/components/admin/AdminLayout'), {
  ssr: false,
});

export default function Home() {
  const { isAuthenticated, navigate } = useAppStore();
  const initialSyncDone = useRef(false);

  // Halaman utama selalu Admin (Dapur)
  useEffect(() => {
    if (initialSyncDone.current) return;
    initialSyncDone.current = true;

    if (!isAuthenticated) {
      navigate('admin-login');
    } else {
      navigate('admin-dashboard');
    }
  }, []);

  return <AdminLayout />;
}
