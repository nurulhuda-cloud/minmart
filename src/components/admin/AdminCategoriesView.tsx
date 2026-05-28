'use client';

import { useEffect, useState, useCallback } from 'react';
import { categories as categoriesApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import type { Category, CategoryForm } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Tag } from 'lucide-react';

const emptyForm: CategoryForm = {
  name: '',
  icon: '',
  sortOrder: 0,
};

export default function AdminCategoriesView() {
  const { token } = useAppStore();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    const res = await categoriesApi.getAll(token);
    if (res.success && res.data) {
      setCategories(res.data);
    }
  }, [token]);

  useEffect(() => {
    fetchCategories().finally(() => setLoading(false));
  }, [fetchCategories]);

  const handleAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      icon: category.icon || '',
      sortOrder: category.sortOrder,
    });
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const res = await categoriesApi.delete(deleteId, token);
    if (res.success) {
      toast({ title: 'Kategori berhasil dihapus' });
      fetchCategories();
    } else {
      toast({ title: 'Gagal menghapus kategori', description: res.error, variant: 'destructive' });
    }
    setDeleteOpen(false);
    setDeleteId(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Nama kategori harus diisi', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      let res;
      if (editingId) {
        res = await categoriesApi.update(editingId, form, token);
      } else {
        res = await categoriesApi.create(form, token);
      }
      if (res.success) {
        toast({
          title: editingId
            ? 'Kategori berhasil diperbarui'
            : 'Kategori berhasil ditambahkan',
        });
        setFormOpen(false);
        fetchCategories();
      } else {
        toast({
          title: 'Gagal menyimpan kategori',
          description: res.error,
          variant: 'destructive',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Kategori</h1>
        <Button
          onClick={handleAdd}
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Kategori
        </Button>
      </div>

      {/* Category Table */}
      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Ikon</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="text-center">Urutan</TableHead>
                <TableHead className="text-center">Jumlah Produk</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                    Belum ada kategori
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-lg">
                        {category.icon || <Tag className="w-4 h-4 text-gray-300" />}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {category.name}
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-500">
                      {category.sortOrder}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        {category.products?.length || 0} produk
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(category)}
                          className="h-8 w-8"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(category.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Category Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Kategori' : 'Tambah Kategori'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="catName">Nama Kategori *</Label>
              <Input
                id="catName"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Masukkan nama kategori"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="catIcon">Ikon (Emoji)</Label>
              <Input
                id="catIcon"
                value={form.icon}
                onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
                placeholder="Contoh: 👕, 🍔, 📱"
                className="rounded-lg"
              />
              <p className="text-xs text-gray-400">
                Gunakan emoji sebagai ikon kategori
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="catSortOrder">Urutan</Label>
              <Input
                id="catSortOrder"
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))
                }
                className="rounded-lg"
              />
            </div>

            {/* Preview */}
            {form.name && (
              <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-lg shadow-sm">
                  {form.icon || <Tag className="w-4 h-4 text-gray-300" />}
                </div>
                <span className="font-medium text-sm text-gray-900">
                  {form.name}
                </span>
              </div>
            )}
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
            <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kategori ini? Produk dalam kategori ini
              akan menjadi tanpa kategori.
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
