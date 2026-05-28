'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatRupiah } from '@/lib/helpers';

export default function CartView() {
  const {
    items,
    removeItem,
    updateQuantity,
    getSubtotal,
    getTotalDiscount,
    getTotal,
    getItemCount,
    navigate,
  } = useAppStore();

  const subtotal = getSubtotal();
  const totalDiscount = getTotalDiscount();
  const total = getTotal();
  const itemCount = getItemCount();

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 px-4"
      >
        <div className="size-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <ShoppingCart className="size-10 text-gray-300" />
        </div>
        <h3 className="text-base font-semibold text-gray-800 mb-1">Keranjang Kosong</h3>
        <p className="text-sm text-gray-500 mb-4 text-center">
          Yuk, mulai belanja dan temukan produk favorit Anda!
        </p>
        <button
          onClick={() => navigate('home')}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          Mulai Belanja
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 py-3 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Keranjang</h2>
        <span className="text-sm text-gray-500">{itemCount} item</span>
      </div>

      {/* Cart Items */}
      <AnimatePresence>
        <div className="space-y-3">
          {items.map((item) => {
            const effectivePrice = item.discountPrice ?? item.price;
            const itemSubtotal = effectivePrice * item.quantity;

            return (
              <motion.div
                key={item.productId}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="flex gap-3 bg-white rounded-xl p-3 shadow-sm"
              >
                {/* Image */}
                <div className="flex-none size-20 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-800 line-clamp-2">{item.name}</h3>
                  <div className="mt-0.5">
                    <span className="text-sm font-bold text-emerald-600">
                      {formatRupiah(effectivePrice)}
                    </span>
                    {item.discountPrice && (
                      <span className="text-[10px] text-gray-400 line-through ml-1">
                        {formatRupiah(item.price)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1 py-0.5">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="p-1 rounded hover:bg-gray-200 transition-colors disabled:opacity-40"
                        disabled={item.quantity <= 1}
                        aria-label="Kurangi"
                      >
                        <Minus className="size-3.5 text-gray-600" />
                      </button>
                      <span className="text-sm font-semibold w-7 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-1 rounded hover:bg-gray-200 transition-colors disabled:opacity-40"
                        disabled={item.quantity >= item.maxStock}
                        aria-label="Tambah"
                      >
                        <Plus className="size-3.5 text-gray-600" />
                      </button>
                    </div>

                    {/* Item subtotal & remove */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700">
                        {formatRupiah(itemSubtotal)}
                      </span>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Hapus item"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>

      {/* Cart Summary */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
        <h3 className="text-sm font-bold text-gray-900 mb-2">Ringkasan</h3>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium">{formatRupiah(subtotal)}</span>
        </div>
        {totalDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Diskon</span>
            <span className="font-medium text-red-500">-{formatRupiah(totalDiscount)}</span>
          </div>
        )}
        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between">
            <span className="text-sm font-bold text-gray-900">Total</span>
            <span className="text-base font-bold text-emerald-600">{formatRupiah(total)}</span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={() => navigate('checkout')}
        className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3.5 rounded-xl transition-colors"
      >
        <span>Checkout</span>
        <ArrowRight className="size-5" />
      </button>
    </motion.div>
  );
}
