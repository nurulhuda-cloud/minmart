'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { Product } from '@/lib/types';
import { formatRupiah, truncate, getStockStatus, parseProductImages } from '@/lib/helpers';
import { toast } from '@/hooks/use-toast';

// ============================================================
// Product Card
// ============================================================
export default function ProductCard({ product }: { product: Product }) {
  const { navigate, addItem } = useAppStore();
  const images = parseProductImages(product.images);
  const firstImage = images[0] || '/placeholder.png';
  const stockStatus = getStockStatus(product.stock, product.minStock);
  const hasDiscount = product.discountPrice != null && product.discountPrice < product.sellPrice;
  const effectivePrice = hasDiscount ? product.discountPrice! : product.sellPrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.sellPrice - product.discountPrice!) / product.sellPrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock === 0) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.sellPrice,
      discountPrice: hasDiscount ? product.discountPrice! : undefined,
      quantity: 1,
      image: firstImage,
      maxStock: product.stock,
    });
    toast({ title: 'Ditambahkan ke keranjang', description: product.name });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => navigate('product', { id: product.id })}
    >
      <div className="relative">
        <div className="aspect-square bg-gray-100">
          <img
            src={firstImage}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
            -{discountPercent}%
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-bold text-sm">Habis</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-xs font-medium text-gray-800 leading-tight min-h-[32px]">
          {truncate(product.name, 40)}
        </h3>
        <div className="mt-1.5">
          <p className="text-sm font-bold text-emerald-600">{formatRupiah(effectivePrice)}</p>
          {hasDiscount && (
            <p className="text-[10px] text-gray-400 line-through">
              {formatRupiah(product.sellPrice)}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className={`text-[10px] font-medium ${stockStatus.color}`}>
            {stockStatus.label}
          </span>
          {product.stock > 0 && (
            <button
              onClick={handleAddToCart}
              className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
              aria-label="Tambah ke keranjang"
            >
              <Plus className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
