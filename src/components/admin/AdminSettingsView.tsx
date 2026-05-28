'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { storeSettings as settingsApi, upload as uploadApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import type { StoreSettingForm } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Store, Upload, X, Download } from 'lucide-react';

export default function AdminSettingsView() {
  const { token } = useAppStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<StoreSettingForm>({
    storeName: '',
    storeSlug: 'toko',
    logoUrl: '',
    whatsappNumber: '',
    address: '',
    operatingHours: '',
    shippingPerKm: 0,
    themeColor: '#10b981',
    instagram: '',
    facebook: '',
    tiktok: '',
    bankAccount: '',
    bankName: '',
    bankHolder: '',
    isOpen: true,
    storeLatitude: undefined,
    storeLongitude: undefined,
  });
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);

  const fetchSettings = useCallback(async () => {
    const res = await settingsApi.get();
    if (res.success && res.data) {
      const s = res.data;
      setForm({
        storeName: s.storeName || '',
        storeSlug: s.storeSlug || 'toko',
        logoUrl: s.logoUrl || '',
        whatsappNumber: s.whatsappNumber || '',
        address: s.address || '',
        operatingHours: s.operatingHours || '',
        shippingPerKm: s.shippingPerKm || 0,
        themeColor: s.themeColor || '#10b981',
        instagram: s.instagram || '',
        facebook: s.facebook || '',
        tiktok: s.tiktok || '',
        bankAccount: s.bankAccount || '',
        bankName: s.bankName || '',
        bankHolder: s.bankHolder || '',
        isOpen: s.isOpen,
        storeLatitude: s.storeLatitude ?? undefined,
        storeLongitude: s.storeLongitude ?? undefined,
      });
    }
  }, []);

  useEffect(() => {
    fetchSettings().finally(() => setLoading(false));
  }, [fetchSettings]);

  const handleLogoUpload = async (files: FileList) => {
    setUploading(true);
    try {
      const res = await uploadApi.uploadFile(files[0], token);
      if (res.success && res.data) {
        setForm((p) => ({ ...p, logoUrl: res.data!.url }));
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.storeName.trim()) {
      toast({ title: 'Nama toko harus diisi', variant: 'destructive' });
      return;
    }
    if (!form.storeSlug.trim()) {
      toast({ title: 'Slug toko harus diisi', variant: 'destructive' });
      return;
    }
    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(form.storeSlug)) {
      toast({ title: 'Slug hanya boleh huruf kecil, angka, dan tanda hubung (-)', variant: 'destructive' });
      return;
    }
    const RESERVED_SLUGS = ['api', 'admin', 'toko', '_next', 'uploads'];
    if (RESERVED_SLUGS.includes(form.storeSlug.toLowerCase())) {
      toast({ title: 'Slug ini tidak bisa digunakan (reserved)', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await settingsApi.update(form, token);
      if (res.success) {
        toast({ title: 'Pengaturan berhasil disimpan' });
        setSlugAvailable(null); // reset after save
      } else {
        toast({
          title: 'Gagal menyimpan pengaturan',
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
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
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
            <>
              <Save className="w-4 h-4 mr-2" />
              Simpan
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Info */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-500" />
              Informasi Toko
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Nama Toko *</Label>
              <Input
                id="storeName"
                value={form.storeName}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((p) => ({ ...p, storeName: name }));
                }}
                placeholder="Nama toko"
                className="rounded-lg"
              />
            </div>

            {/* Store Slug / Custom URL */}
            <div className="space-y-2">
              <Label htmlFor="storeSlug">Link Toko (Slug) *</Label>
              <div className="flex items-center gap-0">
                <span className="text-sm text-gray-400 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg px-3 py-2 whitespace-nowrap">
                  {typeof window !== 'undefined' ? window.location.origin + '/' : '/'}
                </span>
                <Input
                  id="storeSlug"
                  value={form.storeSlug}
                  onChange={(e) => {
                    // Auto-format: lowercase, replace spaces with hyphens, remove special chars
                    const raw = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    setForm((p) => ({ ...p, storeSlug: raw }));
                    setSlugAvailable(null);
                  }}
                  onBlur={async () => {
                    if (!form.storeSlug.trim()) return;
                    setSlugChecking(true);
                    try {
                      const res = await settingsApi.get();
                      if (res.success && res.data) {
                        // Slug available if it's the current one or not taken
                        setSlugAvailable(res.data.storeSlug === form.storeSlug || !res.data.storeSlug);
                      }
                    } catch {
                      // ignore
                    } finally {
                      setSlugChecking(false);
                    }
                  }}
                  placeholder="minmart"
                  className="rounded-r-lg rounded-l-none"
                />
              </div>
              <p className="text-xs text-gray-500">
                Huruf kecil, angka, dan tanda hubung (-). Ini akan menjadi link toko kamu: <span className="font-medium text-emerald-600">/{form.storeSlug || 'toko'}</span>
              </p>
              {slugChecking && (
                <p className="text-xs text-gray-400">Memeriksa ketersediaan...</p>
              )}
              {!slugChecking && slugAvailable === true && form.storeSlug !== 'toko' && (
                <p className="text-xs text-emerald-600 font-medium">✓ Slug tersedia</p>
              )}
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Logo Toko</Label>
              <div className="flex items-center gap-4">
                {form.logoUrl ? (
                  <div className="relative group">
                    <img
                      src={form.logoUrl}
                      alt="Logo"
                      className="w-16 h-16 rounded-lg object-cover border"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, logoUrl: '' }))}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    ) : (
                      <Upload className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) handleLogoUpload(e.target.files);
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                >
                  Upload Logo
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
              <Input
                id="whatsapp"
                value={form.whatsappNumber}
                onChange={(e) =>
                  setForm((p) => ({ ...p, whatsappNumber: e.target.value }))
                }
                placeholder="62812345678"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Textarea
                id="address"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="Alamat toko"
                rows={2}
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Jam Operasional</Label>
              <Input
                id="hours"
                value={form.operatingHours}
                onChange={(e) =>
                  setForm((p) => ({ ...p, operatingHours: e.target.value }))
                }
                placeholder="Senin - Sabtu, 08:00 - 17:00"
                className="rounded-lg"
              />
            </div>

            {/* Store Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="isOpen" className="cursor-pointer">
                  Status Toko
                </Label>
                <p className="text-xs text-gray-500">
                  {form.isOpen ? 'Toko sedang buka' : 'Toko sedang tutup'}
                </p>
              </div>
              <Switch
                id="isOpen"
                checked={form.isOpen}
                onCheckedChange={(checked) => setForm((p) => ({ ...p, isOpen: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Shipping & Location */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Pengiriman & Lokasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shippingPerKm">Ongkir per KM (Rp)</Label>
              <Input
                id="shippingPerKm"
                type="number"
                value={form.shippingPerKm || ''}
                onChange={(e) =>
                  setForm((p) => ({ ...p, shippingPerKm: Number(e.target.value) }))
                }
                placeholder="0"
                className="rounded-lg"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Lokasi Toko</Label>
              <p className="text-xs text-gray-500">
                Koordinat untuk perhitungan ongkir
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude" className="text-xs">
                    Latitude
                  </Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={form.storeLatitude ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        storeLatitude: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    placeholder="-6.200000"
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude" className="text-xs">
                    Longitude
                  </Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={form.storeLongitude ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        storeLongitude: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    placeholder="106.816666"
                    className="rounded-lg"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Appearance */}
            <div className="space-y-2">
              <Label htmlFor="themeColor">Warna Tema</Label>
              <div className="flex items-center gap-3">
                <input
                  id="themeColor"
                  type="color"
                  value={form.themeColor}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, themeColor: e.target.value }))
                  }
                  className="w-10 h-10 rounded-lg border cursor-pointer"
                />
                <Input
                  value={form.themeColor}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, themeColor: e.target.value }))
                  }
                  className="w-32 rounded-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Media Sosial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={form.instagram}
                onChange={(e) =>
                  setForm((p) => ({ ...p, instagram: e.target.value }))
                }
                placeholder="@username"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={form.facebook}
                onChange={(e) =>
                  setForm((p) => ({ ...p, facebook: e.target.value }))
                }
                placeholder="URL Facebook"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktok">TikTok</Label>
              <Input
                id="tiktok"
                value={form.tiktok}
                onChange={(e) =>
                  setForm((p) => ({ ...p, tiktok: e.target.value }))
                }
                placeholder="@username"
                className="rounded-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bank Account */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Rekening Bank</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Nama Bank</Label>
              <Input
                id="bankName"
                value={form.bankName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, bankName: e.target.value }))
                }
                placeholder="BCA, Mandiri, BNI, dll."
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccount">Nomor Rekening</Label>
              <Input
                id="bankAccount"
                value={form.bankAccount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, bankAccount: e.target.value }))
                }
                placeholder="1234567890"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankHolder">Atas Nama</Label>
              <Input
                id="bankHolder"
                value={form.bankHolder}
                onChange={(e) =>
                  setForm((p) => ({ ...p, bankHolder: e.target.value }))
                }
                placeholder="Nama pemilik rekening"
                className="rounded-lg"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save & Download Buttons at Bottom */}
      <div className="flex items-center justify-between pt-4">
        <Button
          onClick={() => {
            const a = document.createElement('a');
            a.href = '/api/download';
            a.download = 'minmart-project.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast({ title: 'Download dimulai!', description: 'File minmart-project.zip sedang diunduh...' });
          }}
          variant="outline"
          className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 gap-2"
        >
          <Download className="w-4 h-4" />
          Download Project
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-500 hover:bg-emerald-600 text-white min-w-32"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Simpan Pengaturan
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
