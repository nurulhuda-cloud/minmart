'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trash2, Plus, ShoppingCart } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { favorites as favoritesApi, products as productsApi } from '@/lib/api';
import type { Product } from '@/lib/types';
import { formatRupiah, parseProductImages } from '@/lib/helpers';
import { Skeleton } from '@/components/ui/skeleton';

interface WishlistItem {
  id: string;
  productId: string;
  product?: Product;
}

export default function WishlistView() {
  const { navigate, addItem, sessionId } = useAppStore();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await favoritesApi.get(sessionId);
      if (res.success && res.data) {
        setWishlistItems(res.data);
      }
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemove = async (productId: string) => {
    await favoritesApi.remove(productId, sessionId);
    setWishlistItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleAddToCart = (fav: WishlistItem) => {
    if (!fav.product || fav.product.stock === 0) return;
    const images = parseProductImages(fav.product.images);
    const hasDiscount =
      fav.product.discountPrice != null && fav.product.discountPrice < fav.product.sellPrice;
    addItem({
      productId: fav.product.id,
      name: fav.product.name,
      price: fav.product.sellPrice,
      discountPrice: hasDiscount ? fav.product.discountPrice! : undefined,
      quantity: 1,
      image: images[0] || '/placeholder.png',
      maxStock: fav.product.stock,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 py-3 space-y-3"
    >
      <h2 className="text-lg font-bold text-gray-900">Wishlist</h2>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 bg-white rounded-xl p-3 shadow-sm">
              <Skeleton className="size-20 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-5 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="size-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Heart className="size-10 text-gray-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">Wishlist Kosong</h3>
          <p className="text-sm text-gray-500 mb-4 text-center">
            Tambahkan produk favorit Anda dengan menekan ikon hati
          </p>
          <button
            onClick={() => navigate('home')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            Mulai Belanja
          </button>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {wishlistItems.map((fav) => {
              const product = fav.product;
              if (!product) return null;
              const images = parseProductImages(product.images);
              const firstImage = images[0] || '/placeholder.png';
              const hasDiscount =
                product.discountPrice != null && product.discountPrice < product.sellPrice;
              const effectivePrice = hasDiscount ? product.discountPrice! : product.sellPrice;

              return (
                <motion.div
                  key={fav.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="flex gap-3 bg-white rounded-xl p-3 shadow-sm"
                >
                  {/* Image */}
                  <button
                    onClick={() => navigate('product', { id: product.id })}
                    className="flex-none size-20 rounded-lg overflow-hidden bg-gray-100"
                  >
                    <img
                      src={firstImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-sm font-medium text-gray-800 truncate cursor-pointer hover:text-emerald-600"
                      onClick={() => navigate('product', { id: product.id })}
                    >
                      {product.name}
                    </h3>
                    <p className="text-sm font-bold text-emerald-600 mt-0.5">
                      {formatRupiah(effectivePrice)}
                    </p>
                    {hasDiscount && (
                      <p className="text-[10px] text-gray-400 line-through">
                        {formatRupiah(product.sellPrice)}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleAddToCart(fav)}
                        disabled={product.stock === 0}
                        className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <ShoppingCart className="size-3" />
                        <span>Keranjang</span>
                      </button>
                      <button
                        onClick={() => handleRemove(product.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Hapus dari wishlist"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}
