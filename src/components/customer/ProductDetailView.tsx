'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  Share2,
  Minus,
  Plus,
  ShoppingCart,
  MessageCircle,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { products as productsApi, favorites as favoritesApi, storeSettings } from '@/lib/api';
import type { Product, StoreSetting } from '@/lib/types';
import {
  formatRupiah,
  getStockStatus,
  parseProductImages,
  generateWhatsAppLink,
  generateOrderMessage,
} from '@/lib/helpers';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

export default function ProductDetailView({ productId }: { productId?: string }) {
  const { navigate, goBack, addItem, sessionId } = useAppStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [fetchedId, setFetchedId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [storeSetting, setStoreSetting] = useState<StoreSetting | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel();
  const initialIndexSet = useRef(false);

  const loading = fetchedId !== productId;

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedImageIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    // Defer initial index read to avoid synchronous setState in effect
    requestAnimationFrame(() => {
      if (!initialIndexSet.current) {
        initialIndexSet.current = true;
        setSelectedImageIndex(emblaApi.selectedScrollSnap());
      }
    });
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Fetch product
  useEffect(() => {
    if (!productId) return;
    productsApi.getById(productId).then((res) => {
      if (res.success && res.data && res.data.id === productId) {
        setProduct(res.data);
        setFetchedId(productId);
        setQuantity(1);
        // Fetch related products (same category)
        if (res.data.categoryId) {
          productsApi.getPublic({ categoryId: res.data.categoryId, pageSize: 6 }).then((relRes) => {
            if (relRes.success && relRes.data) {
              const items = relRes.data.items || relRes.data.products || [];
              setRelatedProducts(
                (Array.isArray(items) ? items : []).filter((p) => p.id !== productId).slice(0, 4)
              );
            }
          });
        }
      }
    });
  }, [productId]);

  // Fetch store settings & favorites
  useEffect(() => {
    storeSettings.get().then((res) => {
      if (res.success && res.data) setStoreSetting(res.data);
    });
    if (sessionId && productId) {
      favoritesApi.get(sessionId).then((res) => {
        if (res.success && res.data) {
          setIsFavorite(res.data.some((f) => f.productId === productId));
        }
      });
    }
  }, [sessionId, productId]);

  const toggleFavorite = async () => {
    if (!productId || favoriteLoading) return;
    setFavoriteLoading(true);
    if (isFavorite) {
      await favoritesApi.remove(productId, sessionId);
      setIsFavorite(false);
    } else {
      await favoritesApi.add(productId, sessionId);
      setIsFavorite(true);
    }
    setFavoriteLoading(false);
  };

  const handleAddToCart = () => {
    if (!product || product.stock === 0) return;
    const images = parseProductImages(product.images);
    const hasDiscount =
      product.discountPrice != null && product.discountPrice < product.sellPrice;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.sellPrice,
      discountPrice: hasDiscount ? product.discountPrice! : undefined,
      quantity,
      image: images[0] || '/placeholder.png',
      maxStock: product.stock,
    });
    toast({ title: 'Ditambahkan ke keranjang', description: product.name });
  };

  const handleWhatsAppCheckout = () => {
    if (!product || !storeSetting) return;
    const effectivePrice = product.discountPrice ?? product.sellPrice;
    const message = generateOrderMessage({
      orderNumber: '-',
      items: [{ name: product.name, quantity, price: effectivePrice }],
      subtotal: effectivePrice * quantity,
      shippingCost: 0,
      total: effectivePrice * quantity,
      deliveryMethod: 'pickup',
      customerName: '',
      customerPhone: '',
    });
    const link = generateWhatsAppLink(storeSetting.whatsappNumber, message);
    window.open(link, '_blank');
  };

  const handleShare = async () => {
    if (!product) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="w-full aspect-square rounded-xl" />
        <Skeleton className="h-6 w-3/4 rounded" />
        <Skeleton className="h-8 w-1/2 rounded" />
        <Skeleton className="h-20 w-full rounded" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <p className="text-gray-500 mb-4">Produk tidak ditemukan</p>
        <button
          onClick={goBack}
          className="text-emerald-600 font-semibold"
        >
          Kembali
        </button>
      </div>
    );
  }

  const images = parseProductImages(product.images);
  const stockStatus = getStockStatus(product.stock, product.minStock);
  const hasDiscount =
    product.discountPrice != null && product.discountPrice < product.sellPrice;
  const effectivePrice = hasDiscount ? product.discountPrice! : product.sellPrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.sellPrice - product.discountPrice!) / product.sellPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="pb-28"
    >
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm flex items-center justify-between px-4 py-2">
        <button
          onClick={goBack}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft className="size-5 text-gray-700" />
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={handleShare}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Bagikan"
          >
            <Share2 className="size-5 text-gray-700" />
          </button>
          <button
            onClick={toggleFavorite}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Wishlist"
            disabled={favoriteLoading}
          >
            <Heart
              className={`size-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-700'}`}
            />
          </button>
        </div>
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="px-4">
          <div ref={emblaRef} className="overflow-hidden rounded-xl">
            <div className="flex">
              {images.map((img, idx) => (
                <div key={idx} className="flex-none w-full">
                  <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                    <img
                      src={img}
                      alt={`${product.name} - ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Dot indicators */}
          {images.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === selectedImageIndex ? 'bg-emerald-500 w-5' : 'bg-gray-300'
                  }`}
                  onClick={() => emblaApi?.scrollTo(idx)}
                  aria-label={`Gambar ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Info */}
      <div className="px-4 mt-4 space-y-3">
        {/* Category */}
        {product.category && (
          <span className="text-xs text-emerald-600 font-medium">
            {product.category.name}
          </span>
        )}

        {/* Name */}
        <h1 className="text-lg font-bold text-gray-900 leading-snug">{product.name}</h1>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-emerald-600">
            {formatRupiah(effectivePrice)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-sm text-gray-400 line-through">
                {formatRupiah(product.sellPrice)}
              </span>
              <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-0.5 rounded-md">
                -{discountPercent}%
              </span>
            </>
          )}
        </div>

        {/* Stock Status */}
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${stockStatus.color}`}>
            {stockStatus.label}
          </span>
          {product.stock > 0 && (
            <span className="text-xs text-gray-400">({product.stock} tersisa)</span>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <div className="pt-3 border-t">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Deskripsi</h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-6 px-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Produk Terkait</h3>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {relatedProducts.map((rp) => {
              const rpImages = parseProductImages(rp.images);
              const rpPrice = rp.discountPrice ?? rp.sellPrice;
              return (
                <button
                  key={rp.id}
                  onClick={() => {
                    setQuantity(1);
                    navigate('product', { id: rp.id });
                  }}
                  className="flex-none w-32 bg-white rounded-xl shadow-sm overflow-hidden active:scale-[0.98] transition-transform"
                >
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={rpImages[0] || '/placeholder.png'}
                      alt={rp.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] text-gray-800 font-medium leading-tight line-clamp-2">
                      {rp.name}
                    </p>
                    <p className="text-xs font-bold text-emerald-600 mt-1">
                      {formatRupiah(rpPrice)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t shadow-[0_-2px_10px_rgba(0,0,0,0.05)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-40">
        <div className="flex items-center gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-2 py-1.5">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-1 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40"
              disabled={quantity <= 1 || product.stock === 0}
              aria-label="Kurangi"
            >
              <Minus className="size-4 text-gray-700" />
            </button>
            <span className="text-sm font-semibold w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              className="p-1 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40"
              disabled={quantity >= product.stock || product.stock === 0}
              aria-label="Tambah"
            >
              <Plus className="size-4 text-gray-700" />
            </button>
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            <ShoppingCart className="size-5" />
            <span className="text-sm">Keranjang</span>
          </button>

          {/* WhatsApp */}
          <button
            onClick={handleWhatsAppCheckout}
            disabled={product.stock === 0}
            className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            <MessageCircle className="size-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
