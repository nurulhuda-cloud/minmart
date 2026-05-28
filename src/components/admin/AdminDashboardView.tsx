'use client';

import { useEffect, useState } from 'react';
import { dashboard as dashboardApi, products as productsApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { formatRupiah, formatDate, parseProductImages } from '@/lib/helpers';
import type { DashboardStats, Product, OrderStatus } from '@/lib/types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DollarSign, ShoppingBag, Package, AlertTriangle, Eye } from 'lucide-react';

const chartConfig = {
  revenue: {
    label: 'Pendapatan',
    color: '#10b981',
  },
} satisfies ChartConfig;

export default function AdminDashboardView() {
  const { token } = useAppStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, productsRes] = await Promise.all([
        dashboardApi.getStats(token),
        productsApi.getAll(token),
      ]);
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (productsRes.success && productsRes.data) {
        const lowStock = productsRes.data.filter(
          (p) => p.stock <= p.minStock
        );
        setLowStockProducts(lowStock.slice(0, 10));
      }
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Penjualan',
      value: stats ? formatRupiah(stats.totalRevenue) : '-',
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Total Pesanan',
      value: stats?.totalOrders != null ? String(stats.totalOrders) : '-',
      icon: ShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Produk Terjual',
      value: stats?.totalProductsSold != null ? String(stats.totalProductsSold) : '-',
      icon: Package,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Stok Menipis',
      value: stats?.lowStockProducts != null ? String(stats.lowStockProducts) : '-',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-60 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title} className="rounded-xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${card.bg}`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Pendapatan 7 Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.revenueChart && stats.revenueChart.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={stats.revenueChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                />
                <YAxis
                  tickFormatter={(v) =>
                    v >= 1000000
                      ? `${(v / 1000000).toFixed(1)}jt`
                      : v >= 1000
                        ? `${(v / 1000).toFixed(0)}rb`
                        : String(v)
                  }
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Belum ada data pendapatan
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Pesanan Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentOrders && stats.recentOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Pesanan</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentOrders.slice(0, 10).map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium text-xs">
                        {String(order.orderNumber)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {String(order.customerName)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {typeof order.total === 'number' ? formatRupiah(order.total) : String(order.total)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs ${
                            ORDER_STATUS_COLORS[order.status as OrderStatus] ||
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {ORDER_STATUS_LABELS[order.status as OrderStatus] ||
                            String(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {formatDate(order.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-gray-400">
                Belum ada pesanan
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Stok Menipis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Product thumbnail */}
                      <div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
                        {(() => {
                          const images = parseProductImages(product.images);
                          return images[0] ? (
                            <img src={images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-gray-400 m-auto mt-2" />
                          );
                        })()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {String(product.name)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Min. stok: {String(product.minStock)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`ml-3 flex-shrink-0 ${
                        product.stock === 0
                          ? 'border-red-300 text-red-600'
                          : 'border-yellow-300 text-yellow-600'
                      }`}
                    >
                      {product.stock === 0 ? 'Habis' : `Sisa ${String(product.stock)}`}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400">
                Semua stok aman
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
