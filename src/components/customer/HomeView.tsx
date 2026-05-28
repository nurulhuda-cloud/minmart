'use client';

import React, { useEffect, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { motion } from 'framer-motion';
import { Tag, X, ShoppingCart } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { banners as bannersApi, categories as categoriesApi, products as productsApi } from '@/lib/api';
import type { Banner, Category, Product } from '@/lib/types';
import { truncate } from '@/lib/helpers';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/customer/ProductCard';

// ============================================================
// Banner Skeleton
// ============================================================
function BannerSkeleton() {
  return <Skeleton className="w-full h-44 rounded-xl" />;
}

// ============================================================
// Category Skeleton
// ============================================================
function CategorySkeleton() {
  return (
    <div className="flex gap-3 px-4 overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 min-w-[72px]">
          <Skeleton className="size-14 rounded-full" />
          <Skeleton className="h-3 w-14 rounded" />
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Product Card Skeleton
// ============================================================
function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <Skeleton className="w-full aspect-square" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-5 w-1/2 rounded" />
        <Skeleton className="h-3 w-1/3 rounded" />
      </div>
    </div>
  );
}

// ============================================================
// Banner Carousel
// ============================================================
function BannerCarousel({ bannerList }: { bannerList: Banner[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 4000, stopOnInteraction: false }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  if (bannerList.length === 0) return null;

  return (
    <div className="px-4 pt-3">
      <div ref={emblaRef} className="overflow-hidden rounded-xl">
        <div className="flex">
          {bannerList.map((banner) => (
            <div key={banner.id} className="flex-none w-full">
              <div className="relative w-full h-44 rounded-xl overflow-hidden">
                <img
                  src={banner.imageUrl}
                  alt={banner.title || 'Banner'}
                  className="w-full h-full object-cover"
                />
                {(banner.title || banner.subtitle) && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    {banner.title && (
                      <h3 className="text-white font-bold text-sm">{banner.title}</h3>
                    )}
                    {banner.subtitle && (
                      <p className="text-white/80 text-xs mt-0.5">{banner.subtitle}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-2">
        {bannerList.map((_, idx) => (
          <button
            key={idx}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === selectedIndex ? 'bg-emerald-500 w-5' : 'bg-gray-300'
            }`}
            onClick={() => emblaApi?.scrollTo(idx)}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Promo Popup
// ============================================================
function PromoPopup({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100"
          aria-label="Tutup"
        >
          <X className="size-5 text-gray-500" />
        </button>
        <div className="text-center">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-emerald-50 mb-4">
            <Tag className="size-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Selamat Datang! 🎉</h2>
          <p className="text-sm text-gray-600 mb-4">
            Dapatkan penawaran spesial untuk pembelian pertama Anda. Jangan lewatkan promo menarik!
          </p>
          <button
            onClick={onClose}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Belanja Sekarang
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Main HomeView
// ============================================================
const PROMO_DISMISSED_KEY = 'sehatmart_promo_dismissed';
const PROMO_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export default function HomeView() {
  const { navigate, showPromoPopup, setShowPromoPopup } = useAppStore();
  const [bannerList, setBannerList] = useState<Banner[]>([]);
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [productList, setProductList] = useState<Product[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Check if promo popup should be shown (once per 24 hours)
  useEffect(() => {
    if (showPromoPopup) {
      try {
        const dismissedAt = localStorage.getItem(PROMO_DISMISSED_KEY);
        if (dismissedAt && Date.now() - Number(dismissedAt) < PROMO_COOLDOWN_MS) {
          setShowPromoPopup(false);
        }
      } catch {
        // localStorage unavailable, allow popup
      }
    }
  }, [showPromoPopup, setShowPromoPopup]);

  const handlePromoClose = useCallback(() => {
    try {
      localStorage.setItem(PROMO_DISMISSED_KEY, String(Date.now()));
    } catch {
      // localStorage unavailable
    }
    setShowPromoPopup(false);
  }, [setShowPromoPopup]);

  // Fetch data
  useEffect(() => {
    bannersApi.getPublic().then((res) => {
      if (res.success && res.data) setBannerList(res.data);
      setLoadingBanners(false);
    });

    categoriesApi.getPublic().then((res) => {
      if (res.success && res.data) setCategoryList(res.data);
      setLoadingCategories(false);
    });

    productsApi.getPublic({ pageSize: 20 }).then((res) => {
      if (res.success && res.data) {
        const items = res.data.items || res.data.products || [];
        setProductList(Array.isArray(items) ? items : []);
      }
      setLoadingProducts(false);
    }).catch(() => {
      setProductList([]);
      setLoadingProducts(false);
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5 pb-4"
    >
      {/* Promo Popup */}
      {showPromoPopup && <PromoPopup onClose={handlePromoClose} />}

      {/* Banner Section */}
      {loadingBanners ? (
        <div className="px-4 pt-3">
          <BannerSkeleton />
        </div>
      ) : (
        <BannerCarousel bannerList={bannerList} />
      )}

      {/* Categories Section */}
      <section>
        <h2 className="text-sm font-bold text-gray-900 px-4 mb-2">Kategori</h2>
        {loadingCategories ? (
          <CategorySkeleton />
        ) : (
          <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-1">
            {categoryList.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate('search', { categoryId: cat.id })}
                className="flex flex-col items-center gap-1.5 min-w-[72px] group"
              >
                <div className="size-14 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  {cat.icon ? (
                    <span className="text-xl">{cat.icon}</span>
                  ) : (
                    <ShoppingCart className="size-5 text-emerald-600" />
                  )}
                </div>
                <span className="text-[10px] font-medium text-gray-700 text-center leading-tight">
                  {truncate(cat.name, 12)}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Products Section */}
      <section>
        <div className="flex items-center justify-between px-4 mb-2">
          <h2 className="text-sm font-bold text-gray-900">Produk</h2>
          <button
            onClick={() => navigate('search')}
            className="text-xs text-emerald-600 font-semibold"
          >
            Lihat Semua
          </button>
        </div>
        {loadingProducts ? (
          <div className="grid grid-cols-2 gap-3 px-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : productList.length === 0 ? (
          <div className="text-center py-12 px-4">
            <ShoppingCart className="size-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Belum ada produk tersedia</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 px-4">
            {productList.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}
