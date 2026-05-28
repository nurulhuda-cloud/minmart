'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, MessageCircle, Home, Printer } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { storeSettings } from '@/lib/api';
import { formatDate, generateWhatsAppLink, generateOrderMessage, formatRupiah } from '@/lib/helpers';

export default function OrderSuccessView() {
  const { viewParams, navigate, lastOrderDetails } = useAppStore();
  const [storeSetting, setStoreSetting] = useState<{ whatsappNumber: string; storeName: string } | null>(null);
  const orderNumber = viewParams.orderNumber || '';
  const orderId = viewParams.orderId || '';
  // Loading is derived: true until we have order info
  const loading = !orderNumber && !orderId;

  useEffect(() => {
    storeSettings.get().then((res) => {
      if (res.success && res.data) {
        setStoreSetting({
          whatsappNumber: res.data.whatsappNumber,
          storeName: res.data.storeName,
        });
      }
    });
  }, []);

  const handleOpenWhatsApp = () => {
    if (!storeSetting || !orderNumber) return;
    
    let message = '';
    if (lastOrderDetails && lastOrderDetails.orderNumber === orderNumber) {
      message = generateOrderMessage(lastOrderDetails);
    } else {
      // Fallback jika detail tidak tersedia atau nomor pesanan berbeda
      message = `Halo, saya baru saja membuat pesanan dengan nomor *${orderNumber}*. Mohon konfirmasi pesanan saya. Terima kasih!`;
    }
    
    const link = generateWhatsAppLink(storeSetting.whatsappNumber, message);
    window.open(link, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin size-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="px-4 py-6 space-y-6"
    >
      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="flex flex-col items-center"
      >
        <div className="size-20 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
          <CheckCircle2 className="size-12 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Pesanan Berhasil!</h2>
        <p className="text-sm text-gray-500 mt-1">Pesanan Anda sedang diproses</p>
      </motion.div>

      {/* Receipt Style Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden"
      >
        {/* Receipt header */}
        <div className="bg-emerald-500 px-5 py-4 text-center">
          <p className="text-white font-bold text-sm">
            {storeSetting?.storeName || 'Toko Online'}
          </p>
        </div>

        <div className="px-5 py-4 font-mono text-xs space-y-4">
          {/* Dashed top border */}
          <div className="border-b-2 border-dashed border-gray-200" />

          {/* Order number */}
          <div className="text-center">
            <p className="text-gray-500">NO. PESANAN</p>
            <p className="text-base font-bold text-gray-900 mt-0.5">{orderNumber || '-'}</p>
          </div>

          <div className="border-b border-dashed border-gray-200" />

          {/* Date */}
          <div className="flex justify-between">
            <span className="text-gray-500">Tanggal</span>
            <span className="text-gray-800">{formatDate(new Date().toISOString())}</span>
          </div>

          <div className="border-b border-dashed border-gray-200" />

          {/* Items */}
          <div>
            <p className="text-gray-500 mb-2 font-bold">ITEM PESANAN</p>
            <div className="space-y-2">
              {lastOrderDetails && lastOrderDetails.orderNumber === orderNumber ? (
                <>
                  <div className="space-y-1">
                    {lastOrderDetails.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-gray-700">{item.name} x{item.quantity}</span>
                        <span className="text-gray-900 font-bold">{formatRupiah(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-dashed border-gray-200 my-2" />
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-800">{formatRupiah(lastOrderDetails.subtotal)}</span>
                  </div>
                  {lastOrderDetails.shippingCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ongkir</span>
                      <span className="text-gray-800">{formatRupiah(lastOrderDetails.shippingCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold mt-1">
                    <span className="text-gray-900">TOTAL</span>
                    <span className="text-emerald-600 font-bold">{formatRupiah(lastOrderDetails.total)}</span>
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-center italic">
                  Detail item lihat di WhatsApp
                </p>
              )}
            </div>
          </div>

          <div className="border-b-2 border-dashed border-gray-200" />

          {/* Footer note */}
          <div className="text-center space-y-1">
            <p className="text-gray-500">Terima kasih telah berbelanja!</p>
            <p className="text-gray-400">Simpan nomor pesanan untuk referensi</p>
          </div>
        </div>

        {/* Receipt bottom zigzag */}
        <div className="relative h-4 overflow-hidden">
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              backgroundImage:
                'linear-gradient(135deg, #fff 33.33%, transparent 33.33%), linear-gradient(225deg, #fff 33.33%, transparent 33.33%)',
              backgroundSize: '12px 12px',
              backgroundPosition: 'bottom',
            }}
          />
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-3"
      >
        <button
          onClick={handleOpenWhatsApp}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
        >
          <MessageCircle className="size-5" />
          <span>Buka WhatsApp</span>
        </button>

        <button
          onClick={handlePrint}
          className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
        >
          <Printer className="size-4" />
          <span className="text-sm">Cetak Struk</span>
        </button>

        <button
          onClick={() => navigate('home')}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3.5 rounded-xl transition-colors"
        >
          <Home className="size-5" />
          <span>Kembali ke Beranda</span>
        </button>
      </motion.div>
    </motion.div>
  );
}
