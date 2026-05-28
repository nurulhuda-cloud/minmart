'use client';

import { useEffect, useState, useCallback } from 'react';
import { stock as stockApi, products as productsApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { formatDateTime, getStockStatus } from '@/lib/helpers';
import type { Product, StockMovement, StockMovementForm, StockMovementType } from '@/lib/types';
import { STOCK_MOVEMENT_LABELS } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Loader2, PackagePlus, ArrowUpDown, ArrowDown, ArrowUp, Minus } from 'lucide-react';

const movementTypes: { value: StockMovementType; label: string; icon: typeof ArrowDown }[] = [
  { value: 'in', label: 'Stok Masuk', icon: ArrowDown },
  { value: 'out', label: 'Stok Keluar', icon: ArrowUp },
  { value: 'adjustment', label: 'Penyesuaian', icon: Minus },
];

export default function AdminStockView() {
  const { token } = useAppStore();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<StockMovementForm>({
    productId: '',
    type: 'in',
    quantity: 1,
    note: '',
  });

  const fetchProducts = useCallback(async () => {
    const res = await productsApi.getAll(token);
    if (res.success && res.data) {
      setProducts(res.data);
    }
  }, [token]);

  const fetchMovements = useCallback(async () => {
    const res = await stockApi.getMovements(token);
    if (res.success && res.data) {
      setMovements(res.data);
    }
  }, [token]);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchMovements()]).finally(() => setLoading(false));
  }, [fetchProducts, fetchMovements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId) {
      toast({ title: 'Pilih produk terlebih dahulu', variant: 'destructive' });
      return;
    }
    if (form.quantity <= 0) {
      toast({ title: 'Jumlah harus lebih dari 0', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const res = await stockApi.createMovement(form, token);
      if (res.success) {
        toast({ title: 'Pergerakan stok berhasil dicatat' });
        setForm({ productId: '', type: 'in', quantity: 1, note: '' });
        fetchProducts();
        fetchMovements();
      } else {
        toast({
          title: 'Gagal mencatat pergerakan stok',
          description: res.error,
          variant: 'destructive',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'in':
        return 'text-emerald-600 bg-emerald-50';
      case 'out':
        return 'text-red-600 bg-red-50';
      case 'adjustment':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <ArrowDown className="w-4 h-4" />;
      case 'out':
        return <ArrowUp className="w-4 h-4" />;
      case 'adjustment':
        return <ArrowUpDown className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-60 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Manajemen Stok</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Movement Form */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-emerald-500" />
              Catat Pergerakan Stok
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Produk</Label>
                <Select
                  value={form.productId}
                  onValueChange={(v) => setForm((p) => ({ ...p, productId: v }))}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Pilih produk" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (Stok: {product.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipe</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, type: v as StockMovementType }))
                  }
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {movementTypes.map((mt) => (
                      <SelectItem key={mt.value} value={mt.value}>
                        <span className="flex items-center gap-2">
                          <mt.icon className="w-4 h-4" />
                          {mt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Jumlah</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, quantity: Number(e.target.value) }))
                  }
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Catatan</Label>
                <Textarea
                  id="note"
                  value={form.note}
                  onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                  placeholder="Catatan (opsional)"
                  rows={2}
                  className="rounded-lg"
                />
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Current Stock Overview */}
        <Card className="lg:col-span-2 rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Stok Saat Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-center">Stok</TableHead>
                  <TableHead className="text-center">Min. Stok</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                      Belum ada produk
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => {
                    const status = getStockStatus(product.stock, product.minStock);
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium text-sm">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {product.stock}
                        </TableCell>
                        <TableCell className="text-center text-sm text-gray-500">
                          {product.minStock}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${status.color} border-current`}
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Stock Movement History */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Riwayat Pergerakan Stok</CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              Belum ada riwayat pergerakan stok
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {movements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50"
                >
                  <div
                    className={`p-2 rounded-lg ${getMovementColor(movement.type)}`}
                  >
                    {getMovementIcon(movement.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {movement.product?.name || 'Produk tidak ditemukan'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {STOCK_MOVEMENT_LABELS[movement.type as StockMovementType] || movement.type}
                      {movement.note && ` · ${movement.note}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        movement.type === 'in'
                          ? 'text-emerald-600'
                          : movement.type === 'out'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                      }`}
                    >
                      {movement.type === 'in' ? '+' : '-'}
                      {movement.quantity}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDateTime(movement.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
