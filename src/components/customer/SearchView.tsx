'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, X, SlidersHorizontal } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { products as productsApi, categories as categoriesApi } from '@/lib/api';
import type { Product, Category } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/customer/ProductCard';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'price_asc', label: 'Harga Terendah' },
  { value: 'price_desc', label: 'Harga Tertinggi' },
  { value: 'popular', label: 'Promo' },
] as const;

// ============================================================
// Main SearchView
// ============================================================
export default function SearchView() {
  const { goBack, viewParams } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(viewParams.categoryId || '');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [loading, setLoading] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  // Auto-focus search input
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Fetch categories
  useEffect(() => {
    categoriesApi.getPublic().then((res) => {
      if (res.success && res.data) setCategories(res.data);
    });
  }, []);

  // Fetch products with debounce
  const fetchProducts = useCallback(
    async (query: string, categoryId: string, sort: string) => {
      setLoading(true);
      try {
        const res = await productsApi.getPublic({
          search: query || undefined,
          categoryId: categoryId || undefined,
          sortBy: sort as any,
          pageSize: 40,
        });
        if (res.success && res.data) {
          const items = res.data.items || res.data.products || [];
          setProducts(Array.isArray(items) ? items : []);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fetch products (immediate on mount, debounced on subsequent changes)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchProducts(searchQuery, selectedCategory, sortBy);
    } else {
      debounceRef.current = setTimeout(() => {
        fetchProducts(searchQuery, selectedCategory, sortBy);
      }, 300);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, selectedCategory, sortBy, fetchProducts]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm px-4 py-2 flex items-center gap-2">
        <button
          onClick={goBack}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft className="size-5 text-gray-700" />
        </button>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-9 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              aria-label="Hapus pencarian"
            >
              <X className="size-4 text-gray-400" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowSort(!showSort)}
          className={`p-2 rounded-full transition-colors ${showSort ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-gray-100 text-gray-600'}`}
          aria-label="Urutkan"
        >
          <SlidersHorizontal className="size-5" />
        </button>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setSelectedCategory('')}
          className={`flex-none px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            selectedCategory === ''
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Semua
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex-none px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              selectedCategory === cat.id
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Sort options */}
      {showSort && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 flex gap-2 flex-wrap"
        >
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                sortBy === opt.value
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </motion.div>
      )}

      {/* Results */}
      <div className="px-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <Skeleton className="w-full aspect-square" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-5 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Search className="size-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Tidak ada produk ditemukan</p>
            <p className="text-xs text-gray-400 mt-1">Coba kata kunci lain</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
