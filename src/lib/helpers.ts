/**
 * Format a number as Indonesian Rupiah currency.
 * e.g. formatRupiah(15000) → "Rp 15.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generate a URL-safe slug from a string.
 * e.g. generateSlug("Kemeja Batik Pria") → "kemeja-batik-pria"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove non-word chars (keep letters, digits, underscore, hyphen, space)
    .replace(/[\s_]+/g, '-')  // replace spaces and underscores with hyphens
    .replace(/-+/g, '-')      // collapse multiple hyphens
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
}

/**
 * Truncate text to a maximum length, appending "..." if truncated.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Get a human-readable stock status with a color class.
 */
export function getStockStatus(
  stock: number,
  minStock: number
): { label: string; color: string } {
  if (stock === 0) {
    return { label: 'Habis', color: 'text-red-600' };
  }
  if (stock <= minStock) {
    return { label: 'Stok Rendah', color: 'text-yellow-600' };
  }
  return { label: 'Tersedia', color: 'text-green-600' };
}

/**
 * Format a date string or Date object to Indonesian locale.
 * e.g. formatDate("2025-01-15T10:30:00") → "15 Januari 2025"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Format a date string with time to Indonesian locale.
 * e.g. formatDateTime("2025-01-15T10:30:00") → "15 Januari 2025, 10.30"
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Generate a WhatsApp deep link (wa.me).
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Generate a formatted order message for WhatsApp.
 */
export function generateOrderMessage(order: {
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  shippingCost: number;
  total: number;
  deliveryMethod: string;
  customerAddress?: string;
  customerName: string;
  customerPhone: string;
}): string {
  const deliveryLabel =
    order.deliveryMethod === 'delivery' ? 'Diantar' : 'Ambil Sendiri';

  const itemLines = order.items
    .map(
      (item) =>
        `• ${item.name} x${item.quantity} - ${formatRupiah(item.price * item.quantity)}`
    )
    .join('\n');

  let message = `🛒 *PESANAN BARU* 🛒\n`;
  message += `No. Pesanan: *${order.orderNumber}*\n`;
  message += `Nama: ${order.customerName}\n`;
  message += `Telepon: ${order.customerPhone}\n`;
  message += `Pengiriman: ${deliveryLabel}\n`;

  if (order.deliveryMethod === 'delivery' && order.customerAddress) {
    message += `Alamat: ${order.customerAddress}\n`;
  }

  message += `\n📦 *Detail Pesanan:*\n${itemLines}\n`;
  message += `\nSubtotal: ${formatRupiah(order.subtotal)}`;

  if (order.shippingCost > 0) {
    message += `\nOngkir: ${formatRupiah(order.shippingCost)}`;
  }

  message += `\n*Total: ${formatRupiah(order.total)}*`;

  return message;
}

/**
 * Calculate the discount percentage between an original price and a discount price.
 * Returns a whole number (0–100).
 */
export function calcDiscountPercent(original: number, discount: number): number {
  if (original <= 0) return 0;
  const percent = Math.round(((original - discount) / original) * 100);
  return Math.max(0, Math.min(100, percent));
}

/**
 * Generate a random session ID for identifying anonymous visitors (e.g. favorites).
 */
export function generateSessionId(): string {
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Parse the product images JSON string into an array of URLs.
 * Handles both string (JSON) and already-parsed array inputs.
 */
export function parseProductImages(images: string | string[]): string[] {
  if (Array.isArray(images)) return images;
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
