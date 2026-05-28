'use client';

import { useEffect, useState, useCallback } from 'react';
import { finance as financeApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { formatRupiah, formatDate } from '@/lib/helpers';
import type { FinanceRecord, FinanceRecordForm, FinanceSummary, FinanceType } from '@/lib/types';
import { FINANCE_TYPE_LABELS } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';

const chartConfig = {
  income: {
    label: 'Pemasukan',
    color: '#10b981',
  },
  expense: {
    label: 'Pengeluaran',
    color: '#ef4444',
  },
} satisfies ChartConfig;

const incomeCategories = [
  'Penjualan',
  'Transfer',
  'Lainnya',
];

const expenseCategories = [
  'Pembelian Stok',
  'Operasional',
  'Gaji',
  'Sewa',
  'Listrik & Air',
  'Transportasi',
  'Lainnya',
];

export default function AdminFinanceView() {
  const { token } = useAppStore();
  const { toast } = useToast();
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('income');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [incomeForm, setIncomeForm] = useState<FinanceRecordForm>({
    type: 'income',
    category: 'Penjualan',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [expenseForm, setExpenseForm] = useState<FinanceRecordForm>({
    type: 'expense',
    category: 'Pembelian Stok',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchRecords = useCallback(async () => {
    const params: { type?: string; startDate?: string; endDate?: string } = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const [incomeRes, expenseRes] = await Promise.all([
      financeApi.getRecords(token, { ...params, type: 'income' }),
      financeApi.getRecords(token, { ...params, type: 'expense' }),
    ]);

    const allRecords: FinanceRecord[] = [];
    if (incomeRes.success && incomeRes.data) allRecords.push(...incomeRes.data);
    if (expenseRes.success && expenseRes.data) allRecords.push(...expenseRes.data);
    allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setRecords(allRecords);
  }, [token, startDate, endDate]);

  const fetchSummary = useCallback(async () => {
    const params: { startDate?: string; endDate?: string } = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await financeApi.getSummary(token, params);
    if (res.success && res.data) {
      setSummary(res.data);
    }
  }, [token, startDate, endDate]);

  useEffect(() => {
    Promise.all([fetchRecords(), fetchSummary()]).finally(() => setLoading(false));
  }, [fetchRecords, fetchSummary]);

  const handleSubmitIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (incomeForm.amount <= 0) {
      toast({ title: 'Jumlah harus lebih dari 0', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await financeApi.createRecord(incomeForm, token);
      if (res.success) {
        toast({ title: 'Pemasukan berhasil dicatat' });
        setIncomeForm({
          type: 'income',
          category: 'Penjualan',
          amount: 0,
          description: '',
          date: new Date().toISOString().split('T')[0],
        });
        fetchRecords();
        fetchSummary();
      } else {
        toast({ title: 'Gagal mencatat pemasukan', description: res.error, variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseForm.amount <= 0) {
      toast({ title: 'Jumlah harus lebih dari 0', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await financeApi.createRecord(expenseForm, token);
      if (res.success) {
        toast({ title: 'Pengeluaran berhasil dicatat' });
        setExpenseForm({
          type: 'expense',
          category: 'Pembelian Stok',
          amount: 0,
          description: '',
          date: new Date().toISOString().split('T')[0],
        });
        fetchRecords();
        fetchSummary();
      } else {
        toast({ title: 'Gagal mencatat pengeluaran', description: res.error, variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  const incomeRecords = records.filter((r) => r.type === 'income');
  const expenseRecords = records.filter((r) => r.type === 'expense');

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Keuangan</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="income" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
            <ArrowUpCircle className="w-4 h-4 mr-1 text-emerald-500" />
            Pemasukan
          </TabsTrigger>
          <TabsTrigger value="expense" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
            <ArrowDownCircle className="w-4 h-4 mr-1 text-red-500" />
            Pengeluaran
          </TabsTrigger>
          <TabsTrigger value="summary" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
            <DollarSign className="w-4 h-4 mr-1" />
            Ringkasan
          </TabsTrigger>
        </TabsList>

        {/* Income Tab */}
        <TabsContent value="income" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-500" />
                  Tambah Pemasukan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitIncome} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Select
                      value={incomeForm.category}
                      onValueChange={(v) =>
                        setIncomeForm((p) => ({ ...p, category: v }))
                      }
                    >
                      <SelectTrigger className="rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {incomeCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="incomeAmount">Jumlah (Rp)</Label>
                    <Input
                      id="incomeAmount"
                      type="number"
                      value={incomeForm.amount || ''}
                      onChange={(e) =>
                        setIncomeForm((p) => ({ ...p, amount: Number(e.target.value) }))
                      }
                      placeholder="0"
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="incomeDesc">Deskripsi</Label>
                    <Textarea
                      id="incomeDesc"
                      value={incomeForm.description}
                      onChange={(e) =>
                        setIncomeForm((p) => ({ ...p, description: e.target.value }))
                      }
                      placeholder="Deskripsi (opsional)"
                      rows={2}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="incomeDate">Tanggal</Label>
                    <Input
                      id="incomeDate"
                      type="date"
                      value={incomeForm.date}
                      onChange={(e) =>
                        setIncomeForm((p) => ({ ...p, date: e.target.value }))
                      }
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

            <Card className="lg:col-span-2 rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Riwayat Pemasukan</CardTitle>
              </CardHeader>
              <CardContent>
                {incomeRecords.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    Belum ada pemasukan
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {incomeRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {record.category || 'Lainnya'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {record.description || '-'} · {formatDate(record.date)}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-emerald-600">
                          +{formatRupiah(record.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Expense Tab */}
        <TabsContent value="expense" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-red-500" />
                  Tambah Pengeluaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitExpense} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Select
                      value={expenseForm.category}
                      onValueChange={(v) =>
                        setExpenseForm((p) => ({ ...p, category: v }))
                      }
                    >
                      <SelectTrigger className="rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expenseAmount">Jumlah (Rp)</Label>
                    <Input
                      id="expenseAmount"
                      type="number"
                      value={expenseForm.amount || ''}
                      onChange={(e) =>
                        setExpenseForm((p) => ({ ...p, amount: Number(e.target.value) }))
                      }
                      placeholder="0"
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expenseDesc">Deskripsi</Label>
                    <Textarea
                      id="expenseDesc"
                      value={expenseForm.description}
                      onChange={(e) =>
                        setExpenseForm((p) => ({ ...p, description: e.target.value }))
                      }
                      placeholder="Deskripsi (opsional)"
                      rows={2}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expenseDate">Tanggal</Label>
                    <Input
                      id="expenseDate"
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) =>
                        setExpenseForm((p) => ({ ...p, date: e.target.value }))
                      }
                      className="rounded-lg"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
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

            <Card className="lg:col-span-2 rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Riwayat Pengeluaran</CardTitle>
              </CardHeader>
              <CardContent>
                {expenseRecords.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    Belum ada pengeluaran
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {expenseRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {record.category || 'Lainnya'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {record.description || '-'} · {formatDate(record.date)}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-red-600">
                          -{formatRupiah(record.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-6 mt-4">
          {/* Date Filter */}
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>Dari Tanggal</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label>Sampai Tanggal</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg"
              />
            </div>
            {(startDate || endDate) && (
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Reset
              </Button>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="rounded-xl shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-emerald-50">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Pemasukan</p>
                    <p className="text-xl font-bold text-emerald-600">
                      {formatRupiah(summary?.totalIncome || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-red-50">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Pengeluaran</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatRupiah(summary?.totalExpense || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-blue-50">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Profit</p>
                    <p
                      className={`text-xl font-bold ${
                        (summary?.profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {formatRupiah(summary?.profit || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Pemasukan vs Pengeluaran</CardTitle>
            </CardHeader>
            <CardContent>
              {summary?.monthlyBreakdown && summary.monthlyBreakdown.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                  <BarChart data={summary.monthlyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
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
                    <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-gray-400">
                  Belum ada data keuangan
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
