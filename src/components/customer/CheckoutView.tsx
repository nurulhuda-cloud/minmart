'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calculator, Truck, Package, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { orders as ordersApi, storeSettings } from '@/lib/api';
import type { StoreSetting, Order as OrderType } from '@/lib/types';
import { formatRupiah, generateWhatsAppLink, generateOrderMessage } from '@/lib/helpers';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function CheckoutView() {
  const {
    goBack,
    navigate,
    items,
    getSubtotal,
    getTotalDiscount,
    getTotal,
    clearCart,
  } = useAppStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [distance, setDistance] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [notes, setNotes] = useState('');
  const [storeSetting, setStoreSetting] = useState<StoreSetting | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const subtotal = getSubtotal();
  const totalDiscount = getTotalDiscount();
  const total = getTotal() + shippingCost;

  useEffect(() => {
    storeSettings.get().then((res) => {
      if (res.success && res.data) setStoreSetting(res.data);
    });
  }, []);

  const calculateShipping = () => {
    const km = parseFloat(distance);
    if (isNaN(km) || km <= 0) return;
    const perKm = storeSetting?.shippingPerKm || 5000;
    setShippingCost(km * perKm);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!customerName.trim()) errs.name = 'Nama wajib diisi';
    if (!customerPhone.trim()) errs.phone = 'Nomor telepon wajib diisi';
    if (deliveryMethod === 'delivery' && !customerAddress.trim()) {
      errs.address = 'Alamat wajib diisi untuk pengiriman';
    }
    if (items.length === 0) errs.items = 'Keranjang kosong';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    setSubmitting(true);

    try {
      const orderData = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: deliveryMethod === 'delivery' ? customerAddress.trim() : undefined,
        deliveryMethod,
        shippingCost: deliveryMethod === 'delivery' ? shippingCost : 0,
        shippingDistance: deliveryMethod === 'delivery' ? parseFloat(distance) || null : null,
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const res = await ordersApi.create(orderData);

      if (res.success && res.data) {
        const order = res.data;

        // Generate WhatsApp message
        if (storeSetting) {
          const message = generateOrderMessage({
            orderNumber: order.orderNumber,
            items: items.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.discountPrice ?? item.price,
            })),
            subtotal,
            shippingCost,
            total,
            deliveryMethod,
            customerAddress: customerAddress.trim(),
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
          });
          const waLink = generateWhatsAppLink(storeSetting.whatsappNumber, message);
          window.open(waLink, '_blank');
        }

        clearCart();
        navigate('order-success', {
          orderNumber: order.orderNumber,
          orderId: order.id,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="px-4 py-3 space-y-4 pb-32"
    >
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={goBack}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft className="size-5 text-gray-700" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">Checkout</h2>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-gray-900">Informasi Pelanggan</h3>
        <div>
          <Label htmlFor="name" className="text-xs text-gray-600">Nama *</Label>
          <Input
            id="name"
            placeholder="Nama lengkap"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="mt-1"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>
        <div>
          <Label htmlFor="phone" className="text-xs text-gray-600">Nomor Telepon *</Label>
          <Input
            id="phone"
            placeholder="08xxxxxxxxxx"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="mt-1"
            type="tel"
          />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
        </div>
        <div>
          <Label htmlFor="address" className="text-xs text-gray-600">
            Alamat {deliveryMethod === 'delivery' ? '*' : ''}
          </Label>
          <Textarea
            id="address"
            placeholder="Alamat lengkap untuk pengiriman"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            className="mt-1"
            rows={2}
          />
          {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
        </div>
      </div>

      {/* Delivery Method */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-gray-900">Metode Pengiriman</h3>
        <RadioGroup
          value={deliveryMethod}
          onValueChange={(val) => {
            setDeliveryMethod(val as 'pickup' | 'delivery');
            if (val === 'pickup') {
              setShippingCost(0);
              setDistance('');
            }
          }}
          className="gap-3"
        >
          <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 has-[button[data-state=checked]]:border-emerald-500 has-[button[data-state=checked]]:bg-emerald-50 transition-colors">
            <RadioGroupItem value="pickup" id="pickup" />
            <Label htmlFor="pickup" className="flex items-center gap-2 cursor-pointer flex-1">
              <Package className="size-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium">Ambil Sendiri</p>
                <p className="text-xs text-gray-500">Ambil pesanan di toko</p>
              </div>
            </Label>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 has-[button[data-state=checked]]:border-emerald-500 has-[button[data-state=checked]]:bg-emerald-50 transition-colors">
            <RadioGroupItem value="delivery" id="delivery" />
            <Label htmlFor="delivery" className="flex items-center gap-2 cursor-pointer flex-1">
              <Truck className="size-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium">Diantar</p>
                <p className="text-xs text-gray-500">Pesanan dikirim ke alamat Anda</p>
              </div>
            </Label>
          </div>
        </RadioGroup>

        {/* Shipping cost calculator */}
        {deliveryMethod === 'delivery' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2 pt-2"
          >
            <p className="text-xs text-gray-500">
              Tarif ongkir: {formatRupiah(storeSetting?.shippingPerKm || 5000)}/km
            </p>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Jarak (km)"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="flex-1"
                min="0"
              />
              <button
                onClick={calculateShipping}
                className="flex items-center gap-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <Calculator className="size-4" />
                Hitung
              </button>
            </div>
            {shippingCost > 0 && (
              <div className="bg-emerald-50 rounded-lg p-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estimasi ongkir</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {formatRupiah(shippingCost)}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Jarak: {distance} km × {formatRupiah(storeSetting?.shippingPerKm || 5000)}/km
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-gray-900">Ringkasan Pesanan</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {items.map((item) => {
            const effectivePrice = item.discountPrice ?? item.price;
            return (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-gray-600 flex-1 truncate pr-2">
                  {item.name} × {item.quantity}
                </span>
                <span className="font-medium whitespace-nowrap">
                  {formatRupiah(effectivePrice * item.quantity)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="border-t pt-2 space-y-1.5">
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
          {shippingCost > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Ongkir</span>
              <span className="font-medium">{formatRupiah(shippingCost)}</span>
            </div>
          )}
          <div className="border-t pt-2">
            <div className="flex justify-between">
              <span className="text-sm font-bold text-gray-900">Total</span>
              <span className="text-base font-bold text-emerald-600">{formatRupiah(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
        <Label htmlFor="notes" className="text-sm font-bold text-gray-900">Catatan (Opsional)</Label>
        <Textarea
          id="notes"
          placeholder="Catatan tambahan untuk pesanan..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      {errors.items && (
        <p className="text-sm text-red-500 text-center">{errors.items}</p>
      )}

      {/* Fixed Place Order Button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t shadow-[0_-2px_10px_rgba(0,0,0,0.05)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-40">
        <button
          onClick={handlePlaceOrder}
          disabled={submitting || items.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-semibold py-3.5 rounded-xl transition-colors"
        >
          {submitting ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <span>Pesan via WhatsApp</span>
            </>
          )}
        </button>
        <p className="text-[10px] text-gray-400 text-center mt-1">
          Total: {formatRupiah(total)}
        </p>
      </div>
    </motion.div>
  );
}
