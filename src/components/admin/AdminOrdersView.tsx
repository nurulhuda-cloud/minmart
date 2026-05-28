'use client';

import { useEffect, useState, useCallback } from 'react';
import { orders as ordersApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { formatRupiah, formatDateTime } from '@/lib/helpers';
import type { Order, OrderStatus } from '@/lib/types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, DELIVERY_METHOD_LABELS } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, ChevronUp } from 'lucide-react';

const statusFilters = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'confirmed', label: 'Dikonfirmasi' },
  { value: 'processing', label: 'Diproses' },
  { value: 'shipped', label: 'Dikirim' },
  { value: 'delivered', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

const statusOptions: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export default function AdminOrdersView() {
  const { token } = useAppStore();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const status = activeTab === 'all' ? undefined : activeTab;
      const res = await ordersApi.getAll(token, status);
      if (!cancelled && res.success && res.data) {
        setOrders(res.data);
      }
      if (!cancelled) {
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [token, activeTab]);

  const fetchOrders = useCallback(async () => {
    const status = activeTab === 'all' ? undefined : activeTab;
    const res = await ordersApi.getAll(token, status);
    if (res.success && res.data) {
      setOrders(res.data);
    }
  }, [token, activeTab]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const res = await ordersApi.updateStatus(orderId, newStatus, token);
    if (res.success) {
      toast({ title: 'Status pesanan berhasil diperbarui' });
      fetchOrders();
    } else {
      toast({ title: 'Gagal memperbarui status', description: res.error, variant: 'destructive' });
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-2">
          {statusFilters.map((_, i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Pesanan</h1>

      {/* Status Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-gray-100 p-1 rounded-lg">
          {statusFilters.map((filter) => (
            <TabsTrigger
              key={filter.value}
              value={filter.value}
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm px-3 py-1.5 rounded-md"
            >
              {filter.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Orders List */}
      <div className="space-y-3">
        {orders.length === 0 ? (
          <Card className="rounded-xl shadow-sm">
            <CardContent className="py-12 text-center text-gray-400">
              Belum ada pesanan
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => {
            const isExpanded = expandedId === order.id;
            return (
              <Card key={order.id} className="rounded-xl shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  {/* Order Header Row */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-900">
                          #{order.orderNumber}
                        </span>
                        <Badge
                          className={`text-xs ${
                            ORDER_STATUS_COLORS[order.status as OrderStatus] ||
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {ORDER_STATUS_LABELS[order.status as OrderStatus] || order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {order.customerName} · {order.customerPhone}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-gray-900">
                        {formatRupiah(order.total)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t bg-gray-50 p-4 space-y-4">
                      {/* Status Update */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600">Ubah Status:</span>
                        <Select
                          value={order.status}
                          onValueChange={(v) => handleStatusChange(order.id, v)}
                        >
                          <SelectTrigger className="w-48 rounded-lg bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((s) => (
                              <SelectItem key={s} value={s}>
                                {ORDER_STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Order Items */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Item Pesanan
                        </h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produk</TableHead>
                              <TableHead className="text-center">Qty</TableHead>
                              <TableHead className="text-right">Harga</TableHead>
                              <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {order.orderItems.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="text-sm">{item.name}</TableCell>
                                <TableCell className="text-center text-sm">
                                  {item.quantity}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {formatRupiah(item.price)}
                                </TableCell>
                                <TableCell className="text-right text-sm font-medium">
                                  {formatRupiah(item.subtotal)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Customer & Delivery Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-gray-700">Info Pelanggan</h4>
                          <p className="text-sm text-gray-600">{order.customerName}</p>
                          <p className="text-sm text-gray-600">{order.customerPhone}</p>
                          {order.customerAddress && (
                            <p className="text-sm text-gray-600">{order.customerAddress}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-gray-700">Pengiriman</h4>
                          <p className="text-sm text-gray-600">
                            {DELIVERY_METHOD_LABELS[order.deliveryMethod as keyof typeof DELIVERY_METHOD_LABELS] || order.deliveryMethod}
                          </p>
                          {order.shippingCost > 0 && (
                            <p className="text-sm text-gray-600">
                              Ongkir: {formatRupiah(order.shippingCost)}
                            </p>
                          )}
                          {order.notes && (
                            <p className="text-sm text-gray-600">Catatan: {order.notes}</p>
                          )}
                        </div>
                      </div>

                      {/* Totals */}
                      <div className="bg-white rounded-lg p-3 space-y-1 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal</span>
                          <span>{formatRupiah(order.subtotal)}</span>
                        </div>
                        {order.totalDiscount > 0 && (
                          <div className="flex justify-between text-red-500">
                            <span>Diskon</span>
                            <span>-{formatRupiah(order.totalDiscount)}</span>
                          </div>
                        )}
                        {order.shippingCost > 0 && (
                          <div className="flex justify-between text-gray-600">
                            <span>Ongkir</span>
                            <span>{formatRupiah(order.shippingCost)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t">
                          <span>Total</span>
                          <span>{formatRupiah(order.total)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
