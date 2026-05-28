'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { banners as bannersApi, upload as uploadApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import type { Banner, BannerForm } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Upload, X, ImageIcon } from 'lucide-react';

const emptyForm: BannerForm = {
  imageUrl: '',
  title: '',
  subtitle: '',
  link: '',
  sortOrder: 0,
  active: true,
};

export default function AdminBannersView() {
  const { token } = useAppStore();
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBanners = useCallback(async () => {
    const res = await bannersApi.getAll(token);
    if (res.success && res.data) {
      setBanners(res.data);
    }
  }, [token]);

  useEffect(() => {
    fetchBanners().finally(() => setLoading(false));
  }, [fetchBanners]);

  const handleAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const handleEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setForm({
      imageUrl: banner.imageUrl,
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      link: banner.link || '',
      sortOrder: banner.sortOrder,
      active: banner.active,
    });
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const res = await bannersApi.delete(deleteId, token);
    if (res.success) {
      toast({ title: 'Banner berhasil dihapus' });
      fetchBanners();
    } else {
      toast({ title: 'Gagal menghapus banner', description: res.error, variant: 'destructive' });
    }
    setDeleteOpen(false);
    setDeleteId(null);
  };

  const handleImageUpload = async (files: FileList) => {
    setUploading(true);
    try {
      const res = await uploadApi.uploadFile(files[0], token);
      if (res.success && res.data) {
        setForm((prev) => ({ ...prev, imageUrl: res.data!.url }));
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.imageUrl) {
      toast({ title: 'Gambar banner harus diupload', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      let res;
      if (editingId) {
        res = await bannersApi.update(editingId, form, token);
      } else {
        res = await bannersApi.create(form, token);
      }
      if (res.success) {
        toast({ title: editingId ? 'Banner berhasil diperbarui' : 'Banner berhasil ditambahkan' });
        setFormOpen(false);
        fetchBanners();
      } else {
        toast({ title: 'Gagal menyimpan banner', description: res.error, variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Banner</h1>
        <Button
          onClick={handleAdd}
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Banner
        </Button>
      </div>

      {/* Banner List */}
      {banners.length === 0 ? (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="py-12 text-center text-gray-400">
            Belum ada banner
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {banners.map((banner) => (
            <Card key={banner.id} className="rounded-xl shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {banner.imageUrl ? (
                      <img
                        src={banner.imageUrl}
                        alt={banner.title || 'Banner'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {banner.title || 'Tanpa Judul'}
                      </h3>
                      <Badge
                        variant="outline"
                        className={
                          banner.active
                            ? 'border-emerald-300 text-emerald-600'
                            : 'border-gray-300 text-gray-500'
                        }
                      >
                        {banner.active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                    {banner.subtitle && (
                      <p className="text-sm text-gray-500 truncate">{banner.subtitle}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Urutan: {banner.sortOrder}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(banner)}
                      className="h-8 w-8"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(banner.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Banner Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Banner' : 'Tambah Banner'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Gambar Banner *</Label>
              {form.imageUrl ? (
                <div className="relative group">
                  <img
                    src={form.imageUrl}
                    alt="Banner preview"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, imageUrl: '' }))}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
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
                      <p className="text-sm">Klik untuk upload gambar</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Judul</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Judul banner"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subjudul</Label>
              <Input
                id="subtitle"
                value={form.subtitle}
                onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
                placeholder="Subjudul banner"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Link</Label>
              <Input
                id="link"
                value={form.link}
                onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))}
                placeholder="URL tujuan (opsional)"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Urutan</Label>
              <Input
                id="sortOrder"
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))
                }
                className="rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <Label htmlFor="active" className="cursor-pointer">
                Banner Aktif
              </Label>
              <Switch
                id="active"
                checked={form.active}
                onCheckedChange={(checked) =>
                  setForm((p) => ({ ...p, active: checked }))
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
            <AlertDialogTitle>Hapus Banner</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus banner ini?
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
