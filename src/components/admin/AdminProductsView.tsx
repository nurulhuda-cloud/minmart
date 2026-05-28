'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { products as productsApi, categories as categoriesApi, upload as uploadApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { formatRupiah, getStockStatus } from '@/lib/helpers';
import type { Product, Category, ProductForm } from '@/lib/types';
import { parseProductImages } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Plus, Search, Pencil, Trash2, Upload, X, Loader2, ImagePlus } from 'lucide-react';

const emptyForm: ProductForm = {
  name: '',
  description: '',
  categoryId: undefined,
  sku: '',
  basePrice: 0,
  sellPrice: 0,
  discountPrice: undefined,
  stock: 0,
  minStock: 5,
  images: [],
  isActive: true,
};

export default function AdminProductsView() {
  const { token } = useAppStore();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = useCallback(async () => {
    const res = await productsApi.getAll(token, search);
    if (res.success && res.data) {
      setProducts(res.data);
    }
  }, [token, search]);

  const fetchCategories = useCallback(async () => {
    const res = await categoriesApi.getAll(token);
    if (res.success && res.data) {
      setCategories(res.data);
    }
  }, [token]);

  useEffect(() => {
    fetchProducts().finally(() => setLoading(false));
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || '',
      categoryId: product.categoryId || undefined,
      sku: product.sku || '',
      basePrice: product.basePrice,
      sellPrice: product.sellPrice,
      discountPrice: product.discountPrice || undefined,
      stock: product.stock,
      minStock: product.minStock,
      images: parseProductImages(product.images),
      isActive: product.isActive,
    });
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const res = await productsApi.delete(deleteId, token);
    if (res.success) {
      toast({ title: 'Produk berhasil dihapus' });
      fetchProducts();
    } else {
      toast({ title: 'Gagal menghapus produk', description: res.error, variant: 'destructive' });
    }
    setDeleteOpen(false);
    setDeleteId(null);
  };

  const handleImageUpload = async (files: FileList) => {
    setUploading(true);
    try {
      const newImages = [...form.images];
      for (let i = 0; i < files.length; i++) {
        const res = await uploadApi.uploadFile(files[i], token);
        if (res.success && res.data) {
          newImages.push(res.data.url);
        }
      }
      setForm((prev) => ({ ...prev, images: newImages }));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Nama produk harus diisi', variant: 'destructive' });
      return;
    }
    if (form.sellPrice <= 0) {
      toast({ title: 'Harga jual harus lebih dari 0', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload: ProductForm & { discountPercent?: number } = {
        ...form,
        discountPercent:
          form.discountPrice && form.discountPrice < form.sellPrice
            ? Math.round(((form.sellPrice - form.discountPrice) / form.sellPrice) * 100)
            : undefined,
      };

      let res;
      if (editingId) {
        res = await productsApi.update(editingId, payload, token);
      } else {
        res = await productsApi.create(payload, token);
      }

      if (res.success) {
        toast({ title: editingId ? 'Produk berhasil diperbarui' : 'Produk berhasil ditambahkan' });
        setFormOpen(false);
        fetchProducts();
      } else {
        toast({ title: 'Gagal menyimpan produk', description: res.error, variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleImageUpload(e.dataTransfer.files);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Produk</h1>
        <Button
          onClick={handleAdd}
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Produk
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-lg"
        />
      </div>

      {/* Products Table */}
      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Gambar</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Harga Jual</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                    Belum ada produk
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const images = parseProductImages(product.images);
                  const stockStatus = getStockStatus(product.stock, product.minStock);
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        {images[0] ? (
                          <img
                            src={images[0]}
                            alt={product.name}
                            className="w-10 h-10 rounded-md object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                            <ImagePlus className="w-4 h-4 text-gray-300" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-sm max-w-[200px] truncate">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {product.category?.name || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatRupiah(product.sellPrice)}
                        {product.discountPrice && (
                          <div className="text-xs text-red-500">
                            {formatRupiah(product.discountPrice)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium ${stockStatus.color}`}>
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            product.isActive
                              ? 'border-emerald-300 text-emerald-600'
                              : 'border-gray-300 text-gray-500'
                          }
                        >
                          {product.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                            className="h-8 w-8"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id)}
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Produk' : 'Tambah Produk'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Produk *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Masukkan nama produk"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Deskripsi produk"
                rows={3}
                className="rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={form.categoryId || '_none'}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, categoryId: v === '_none' ? undefined : v }))
                  }
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Tanpa Kategori</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon && <span className="mr-1">{cat.icon}</span>}
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                  placeholder="SKU produk"
                  className="rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basePrice">Harga Modal</Label>
                <Input
                  id="basePrice"
                  type="number"
                  value={form.basePrice || ''}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, basePrice: Number(e.target.value) }))
                  }
                  placeholder="0"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellPrice">Harga Jual *</Label>
                <Input
                  id="sellPrice"
                  type="number"
                  value={form.sellPrice || ''}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, sellPrice: Number(e.target.value) }))
                  }
                  placeholder="0"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountPrice">Harga Diskon</Label>
                <Input
                  id="discountPrice"
                  type="number"
                  value={form.discountPrice || ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      discountPrice: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  placeholder="0"
                  className="rounded-lg"
                />
                {form.discountPrice && form.sellPrice > 0 && (
                  <p className="text-xs text-red-500">
                    Diskon{' '}
                    {Math.round(((form.sellPrice - form.discountPrice) / form.sellPrice) * 100)}%
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Stok</Label>
                <Input
                  id="stock"
                  type="number"
                  value={form.stock}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, stock: Number(e.target.value) }))
                  }
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Min. Stok</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={form.minStock}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, minStock: Number(e.target.value) }))
                  }
                  className="rounded-lg"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Gambar Produk</Label>
              <div
                className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-emerald-400 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) handleImageUpload(e.target.files);
                  }}
                />
                {uploading ? (
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Mengupload...
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Klik atau drag & drop gambar</p>
                  </div>
                )}
              </div>
              {form.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img}
                        alt={`Product ${idx + 1}`}
                        className="w-20 h-20 rounded-lg object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <Label htmlFor="isActive" className="cursor-pointer">
                Produk Aktif
              </Label>
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((p) => ({ ...p, isActive: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
