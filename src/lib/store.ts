import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateSessionId } from './helpers';

// ============================================================
// View / Navigation Types
// ============================================================

export type View =
  // Customer views (store preview)
  | 'home'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'search'
  | 'wishlist'
  | 'order-success'
  // Admin views (main management)
  | 'admin-login'
  | 'admin-dashboard'
  | 'admin-products'
  | 'admin-product-form'
  | 'admin-orders'
  | 'admin-stock'
  | 'admin-finance'
  | 'admin-settings'
  | 'admin-banners'
  | 'admin-categories'
  // Store preview from admin
  | 'store-preview';

// ============================================================
// Cart Types
// ============================================================

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  discountPrice?: number;
  quantity: number;
  image: string;
  maxStock: number;
}

// ============================================================
// Admin Auth Types
// ============================================================

interface AdminUser {
  id: string;
  email: string;
  name: string;
}

// ============================================================
// Navigation Slice
// ============================================================

interface NavigationState {
  currentView: View;
  viewParams: Record<string, string>;
  previousViews: Array<{ view: View; params: Record<string, string> }>;
  navigate: (view: View, params?: Record<string, string>) => void;
  goBack: () => void;
  /** Buka halaman toko di tab baru */
  openStore: () => void;
  /** Buka halaman admin di tab baru */
  openAdmin: () => void;
  /** Kembali ke admin (dalam tab yang sama) */
  goToAdmin: () => void;
}

const createNavigationSlice = (set: any, get: any) => ({
  currentView: 'home' as View,
  viewParams: {} as Record<string, string>,
  previousViews: [] as Array<{ view: View; params: Record<string, string> }>,
  navigate: (view: View, params: Record<string, string> = {}) => {
    set((state: NavigationState) => ({
      previousViews: [
        ...state.previousViews,
        { view: state.currentView, params: state.viewParams },
      ],
      currentView: view,
      viewParams: params,
    }));
  },
  goBack: () => {
    set((state: NavigationState) => {
      const previous = state.previousViews;
      if (previous.length === 0) return state;
      const last = previous[previous.length - 1];
      return {
        previousViews: previous.slice(0, -1),
        currentView: last.view,
        viewParams: last.params,
      };
    });
  },
  goToAdmin: () => {
    // Pindah ke admin di tab yang sama (/)
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    set({
      currentView: 'admin-dashboard' as View,
      viewParams: {},
      previousViews: [],
    });
  },
  openStore: () => {
    // Buka toko di tab baru - fetch slug terbaru dari API
    if (typeof window !== 'undefined') {
      fetch('/api/admin/settings')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const slug = data?.storeSlug || 'toko';
          window.open(`/${slug}`, '_blank');
        })
        .catch(() => {
          window.open('/toko', '_blank');
        });
    }
  },
  openAdmin: () => {
    // Buka admin di tab baru (link /)
    if (typeof window !== 'undefined') {
      window.open('/', '_blank');
    }
  },
});

// ============================================================
// Cart Slice
// ============================================================

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotalDiscount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

const createCartSlice = (set: any, get: any) => ({
  items: [] as CartItem[],
  addItem: (item: CartItem) => {
    set((state: CartState) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.maxStock) }
              : i
          ),
        };
      }
      return { items: [...state.items, item] };
    });
  },
  removeItem: (productId: string) => {
    set((state: CartState) => ({
      items: state.items.filter((i) => i.productId !== productId),
    }));
  },
  updateQuantity: (productId: string, quantity: number) => {
    set((state: CartState) => ({
      items: state.items.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) }
          : i
      ),
    }));
  },
  clearCart: () => {
    set({ items: [] });
  },
  getSubtotal: () => {
    return (get() as CartState).items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  },
  getTotalDiscount: () => {
    return (get() as CartState).items.reduce((sum, item) => {
      if (item.discountPrice) {
        return sum + (item.price - item.discountPrice) * item.quantity;
      }
      return sum;
    }, 0);
  },
  getTotal: () => {
    return (get() as CartState).items.reduce((sum, item) => {
      const effectivePrice = item.discountPrice ?? item.price;
      return sum + effectivePrice * item.quantity;
    }, 0);
  },
  getItemCount: () => {
    return (get() as CartState).items.reduce((sum, item) => sum + item.quantity, 0);
  },
});

// ============================================================
// Admin Auth Slice
// ============================================================

interface AdminAuthState {
  isAuthenticated: boolean;
  admin: AdminUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;
}

const createAdminAuthSlice = (set: any, get: any) => ({
  isAuthenticated: false,
  admin: null as AdminUser | null,
  token: null as string | null,
  login: async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.admin && data.token) {
        set({
          isAuthenticated: true,
          admin: data.admin,
          token: data.token,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
  logout: () => {
    set({
      isAuthenticated: false,
      admin: null,
      token: null,
    });
  },
  checkAuth: () => {
    const state = get() as AdminAuthState;
    if (state.token && state.admin) {
      set({ isAuthenticated: true });
    } else {
      set({ isAuthenticated: false, admin: null, token: null });
    }
  },
});

// ============================================================
// UI Slice
// ============================================================

interface UIState {
  showSearch: boolean;
  showPromoPopup: boolean;
  lastOrderDetails: any | null;
  setShowSearch: (show: boolean) => void;
  setShowPromoPopup: (show: boolean) => void;
  setLastOrderDetails: (order: any | null) => void;
}

const createUISlice = (set: any) => ({
  showSearch: false,
  showPromoPopup: false,
  lastOrderDetails: null,
  setShowSearch: (show: boolean) => set({ showSearch: show }),
  setShowPromoPopup: (show: boolean) => set({ showPromoPopup: show }),
  setLastOrderDetails: (order: any | null) => set({ lastOrderDetails: order }),
});

// ============================================================
// Session Slice (for favorites)
// ============================================================

interface SessionState {
  sessionId: string;
}

const createSessionSlice = () => ({
  sessionId: generateSessionId(),
});

// ============================================================
// Combined Store Type
// ============================================================

export type AppStore = NavigationState &
  CartState &
  AdminAuthState &
  UIState &
  SessionState;

// ============================================================
// Combined Store
// ============================================================

export const useAppStore = create<AppStore>()(
  persist(
    (...a) => ({
      ...createNavigationSlice(...a),
      ...createCartSlice(...a),
      ...createAdminAuthSlice(...a),
      ...createUISlice(...a),
      ...createSessionSlice(),
    }),
    {
      name: 'online-shop-store',
      partialize: (state) => ({
        // Only persist these slices
        items: (state as CartState).items,
        isAuthenticated: (state as AdminAuthState).isAuthenticated,
        admin: (state as AdminAuthState).admin,
        token: (state as AdminAuthState).token,
        sessionId: (state as SessionState).sessionId,
        lastOrderDetails: (state as any).lastOrderDetails,
      }),
      merge: (persistedState: any, currentState: AppStore) => {
        return {
          ...currentState,
          ...(persistedState as Partial<AppStore>),
        };
      },
    }
  )
);
