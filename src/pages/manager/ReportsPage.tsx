import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  DollarSign, TrendingUp, TrendingDown, Layers, Users, Wallet,
  Calendar, Search, Printer
} from 'lucide-react';
import { reportService, ReportPeriod, ComprehensiveReport } from '../../lib/reportService';
import { formatPrice, getImageUrl } from '../../lib/types';
import { Skeleton } from '../../components/UI/LoadingSkeleton';

// Custom tooltip for Reports timeline chart
const TimelineTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (active && payload && payload.length) {
    const turnover = payload.find(p => p.dataKey === 'turnover')?.value || 0;
    const expenses = payload.find(p => p.dataKey === 'expenses')?.value || 0;
    const profit = turnover - expenses;

    return (
      <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl p-3 shadow-2xl text-xs space-y-1.5 min-w-[180px]">
        <p className="font-bold text-[#FAFAFA] border-b border-[#2A2A2A] pb-1">{label}</p>
        <div className="flex justify-between items-center text-[#F59E0B]">
          <span>Aylanma:</span>
          <span className="font-bold">{formatPrice(turnover)}</span>
        </div>
        <div className="flex justify-between items-center text-rose-400">
          <span>Xarajatlar & Tan narx:</span>
          <span className="font-semibold">{formatPrice(expenses)}</span>
        </div>
        <div className="flex justify-between items-center text-emerald-400 pt-1 border-t border-[#2A2A2A] font-bold">
          <span>Sof foyda:</span>
          <span>{formatPrice(profit)}</span>
        </div>
      </div>
    );
  }
  return null;
};

const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<ReportPeriod>('week');
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const [report, setReport] = useState<ComprehensiveReport | null>(null);
  const [loading, setLoading] = useState(true);

  // Product table filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'count' | 'revenue' | 'profit'>('count');
  const [activeProductTab, setActiveProductTab] = useState<'all' | 'fast' | 'slow' | 'zero'>('all');

  const loadReport = () => {
    setLoading(true);
    const data = reportService.generateReport(period, customStart, customEnd);
    setReport(data);
    setLoading(false);
  };

  useEffect(() => {
    loadReport();
  }, [period, customStart, customEnd]);

  const handlePeriodChange = (p: ReportPeriod) => {
    setPeriod(p);
    setShowCustomPicker(p === 'custom');
  };

  // Filtered & Sorted products list for the table
  const filteredProducts = useMemo(() => {
    if (!report) return [];

    let list = report.products;

    // Tab filter
    if (activeProductTab === 'fast') {
      list = list.filter(p => p.velocity === 'fast');
    } else if (activeProductTab === 'slow') {
      list = list.filter(p => p.velocity === 'slow');
    } else if (activeProductTab === 'zero') {
      list = list.filter(p => p.velocity === 'zero');
    }

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter(p => p.category_id === selectedCategory);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.category_name.toLowerCase().includes(q));
    }

    // Sorting
    return [...list].sort((a, b) => {
      if (sortBy === 'count') return b.sold_count - a.sold_count;
      if (sortBy === 'revenue') return b.total_turnover - a.total_turnover;
      if (sortBy === 'profit') return b.total_profit - a.total_profit;
      return 0;
    });
  }, [report, activeProductTab, selectedCategory, searchQuery, sortBy]);

  const handlePrint = () => {
    window.print();
  };

  const fin = report?.financials;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#FAFAFA] flex items-center gap-2">
            <span>Moliya va Savdo Hisobotlari</span>
            <span className="text-xs bg-[#242424] text-[#F59E0B] border border-[#F59E0B]/30 px-3 py-1 rounded-full font-semibold">
              {report?.periodLabel || 'Haftalik'}
            </span>
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Davriy aylanma, tan narx, xarajatlar, sof foyda va mahsulotlar ketish tahlili
          </p>
        </div>

        {/* Action Controls: Period Selector & Print */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Period Buttons */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-1 flex items-center gap-1">
            {[
              { id: 'today', label: 'Bugun' },
              { id: 'yesterday', label: 'Kecha' },
              { id: 'week', label: '7 kun' },
              { id: 'month', label: '30 kun' },
              { id: 'all', label: 'Barchasi' },
              { id: 'custom', label: 'Sana tanlash' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handlePeriodChange(tab.id as ReportPeriod)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === tab.id
                    ? 'bg-[#F59E0B] text-black shadow-md shadow-[#F59E0B]/20'
                    : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handlePrint}
            className="bg-[#242424] hover:bg-[#333] border border-[#3A3A3A] text-[#FAFAFA] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer size={15} />
            <span>Chop etish</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker bar (when custom is active) */}
      {showCustomPicker && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex flex-wrap items-center gap-4 text-xs animate-scale-in">
          <span className="font-semibold text-[#FAFAFA] flex items-center gap-1.5">
            <Calendar size={15} className="text-[#F59E0B]" />
            <span>Oraliq sanani belgilang:</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[#A1A1AA]">Dan:</span>
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="bg-[#121212] border border-[#333] rounded-xl px-3 py-1.5 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#A1A1AA]">Gacha:</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="bg-[#121212] border border-[#333] rounded-xl px-3 py-1.5 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
            />
          </div>
        </div>
      )}

      {/* 5 Financial Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Jami Aylanma */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 group hover:border-[#F59E0B]/50 transition-all shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#A1A1AA]">Jami Aylanma</span>
            <div className="w-8 h-8 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B]">
              <DollarSign size={16} />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-7 w-28" />
          ) : (
            <div>
              <p className="text-xl font-black text-[#FAFAFA] tracking-tight">
                {formatPrice(fin?.totalTurnover || 0)}
              </p>
              <p className="text-[11px] text-[#A1A1AA] mt-1.5 flex items-center gap-1">
                <span>{fin?.orderCount || 0} ta buyurtma</span>
                <span>•</span>
                <span>{report?.totalItemsSold || 0} ta taom</span>
              </p>
            </div>
          )}
        </div>

        {/* 2. Mahsulotlar Tan Narxi */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 group hover:border-amber-500/50 transition-all shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#A1A1AA]">Mahsulot Tan Narxi</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Layers size={16} />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-7 w-28" />
          ) : (
            <div>
              <p className="text-xl font-black text-amber-400 tracking-tight">
                {formatPrice(fin?.totalCostPrice || 0)}
              </p>
              <p className="text-[11px] text-[#A1A1AA] mt-1.5">
                Yalpi foyda: <strong className="text-emerald-400">{formatPrice(fin?.grossProfit || 0)}</strong>
              </p>
            </div>
          )}
        </div>

        {/* 3. Ish Haqi & Maoshlar */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 group hover:border-indigo-500/50 transition-all shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#A1A1AA]">Ish Haqi & Maoshlar</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users size={16} />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-7 w-28" />
          ) : (
            <div>
              <p className="text-xl font-black text-indigo-400 tracking-tight">
                {formatPrice(fin?.totalSalaries || 0)}
              </p>
              <p className="text-[11px] text-[#A1A1AA] mt-1.5">
                Jami fond: {formatPrice(fin?.totalPayrollFund || 0)}/oy
              </p>
            </div>
          )}
        </div>

        {/* 4. Boshqa Xarajatlar */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 group hover:border-rose-500/50 transition-all shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#A1A1AA]">Operatsion Xarajatlar</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <TrendingDown size={16} />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-7 w-28" />
          ) : (
            <div>
              <p className="text-xl font-black text-rose-400 tracking-tight">
                {formatPrice(fin?.otherExpenses || 0)}
              </p>
              <p className="text-[11px] text-[#A1A1AA] mt-1.5">
                Ijara, kommunal va xo'jalik
              </p>
            </div>
          )}
        </div>

        {/* 5. Sof Foyda */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 group hover:border-emerald-500/50 transition-all shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#A1A1AA]">Sof Foyda</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet size={16} />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-7 w-28" />
          ) : (
            <div>
              <p className={`text-xl font-black tracking-tight ${((fin?.netProfit || 0) >= 0) ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatPrice(fin?.netProfit || 0)}
              </p>
              <div className="flex items-center gap-1 mt-1.5 text-[11px] text-[#F59E0B] font-semibold">
                <TrendingUp size={12} className="text-emerald-400" />
                <span>Rentabellik: {fin?.profitMargin}% marja</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Chart and Expense Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Timeline Chart (7 cols) */}
        <div className="lg:col-span-7 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#FAFAFA]">Aylanma, Xarajatlar va Sof Foyda Dinamikasi</h3>
              <p className="text-xs text-[#A1A1AA]">Belgilangan davr bo'yicha kunlik tushum va chiqimlar</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <span className="text-[#A1A1AA]">Aylanma</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-[#A1A1AA]">Xarajatlar & Tan narx</span>
              </div>
            </div>
          </div>

          {loading ? (
            <Skeleton className="h-60 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={report?.dailyTimeline || []}>
                <defs>
                  <linearGradient id="turnoverGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="day" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#A1A1AA', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${(v / 100000000).toFixed(1)}M`}
                />
                <Tooltip content={<TimelineTooltip />} />
                <Area type="monotone" dataKey="turnover" stroke="#F59E0B" strokeWidth={2.5} fill="url(#turnoverGrad)" />
                <Area type="monotone" dataKey="expenses" stroke="#F43F5E" strokeWidth={2} fill="url(#expensesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Right: Category Revenue Share & Expenses Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#FAFAFA]">Xarajatlar va Tannarx Taqsimoti</h3>
              <span className="text-xs text-[#A1A1AA]">Jami: {formatPrice(fin?.totalExpenses || 0)}</span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <div className="space-y-3.5">
                {(fin?.expensesByCategory || []).map(cat => (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#FAFAFA] font-medium">{cat.label}</span>
                      <span className="text-[#A1A1AA] font-mono">
                        {formatPrice(cat.amount)} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-[#262626] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          cat.category === 'cogs'
                            ? 'bg-amber-500'
                            : cat.category === 'salary'
                            ? 'bg-indigo-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#262626] mt-4 flex items-center justify-between text-xs text-[#A1A1AA]">
            <span>O'rtacha chek: <strong className="text-[#FAFAFA]">{formatPrice(fin?.averageCheck || 0)}</strong></span>
            <span>Jami stollar aylanmasi: <strong className="text-[#FAFAFA]">{fin?.customerCount || 0} ta stol</strong></span>
          </div>
        </div>
      </div>

      {/* Product Highlights: Fast-Moving vs Slow-Moving & Zero Sales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Fast-Moving Card (Ko'p Ketayotgan Mahsulotlar) */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <span>Ko'p Ketayotgan Taomlar</span>
            </h3>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
              Top sotuvlar
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (report?.topFastMoving || []).length === 0 ? (
            <p className="text-xs text-[#A1A1AA] py-6 text-center">Ma'lumotlar yo'q</p>
          ) : (
            <div className="space-y-2.5">
              {report?.topFastMoving.slice(0, 5).map((item, idx) => (
                <div key={item.id} className="p-2.5 bg-[#141414] rounded-xl border border-[#262626] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-sm shrink-0 font-bold text-[#F59E0B]">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#FAFAFA] truncate">{item.name}</p>
                      <p className="text-[10px] text-[#A1A1AA]">{item.category_name} • {item.share_of_sales}% ulush</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-[#F59E0B] block">{item.sold_count} dona</span>
                    <span className="text-[10px] text-emerald-400 font-semibold block">+{formatPrice(item.total_profit)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Slow-Moving Card (Sekin Ketayotgan Mahsulotlar) */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
              <span className="text-lg">🐢</span>
              <span>Sekin Ketayotgan Taomlar</span>
            </h3>
            <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
              Kam sotilgan (1-2 ta)
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (report?.slowMoving || []).length === 0 ? (
            <p className="text-xs text-emerald-400 py-6 text-center">Barcha taomlar yaxshi sotilmoqda!</p>
          ) : (
            <div className="space-y-2.5">
              {report?.slowMoving.slice(0, 5).map(item => (
                <div key={item.id} className="p-2.5 bg-[#141414] rounded-xl border border-[#262626] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#FAFAFA] truncate">{item.name}</p>
                    <p className="text-[10px] text-amber-400/80">Narxi: {formatPrice(item.price)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-amber-400 block">{item.sold_count} dona</span>
                    <span className="text-[10px] text-[#A1A1AA] block">{formatPrice(item.total_turnover)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zero Sales Card (Umuman Sotilmaganlar) */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
              <span className="text-lg">⭕</span>
              <span>Umuman Sotilmagan</span>
            </h3>
            <span className="text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-semibold">
              0 ta sotuv
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (report?.zeroSales || []).length === 0 ? (
            <p className="text-xs text-emerald-400 py-6 text-center">Ajoyib! Har bir taomdan buyurtma olingan.</p>
          ) : (
            <div className="space-y-2.5">
              {report?.zeroSales.slice(0, 5).map(item => (
                <div key={item.id} className="p-2.5 bg-[#141414] rounded-xl border border-[#262626] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#FAFAFA] truncate">{item.name}</p>
                    <p className="text-[10px] text-rose-400/80">Tavsiya: Narxini yoki menyu o'rnini qayta ko'rib chiqing</p>
                  </div>
                  <span className="text-xs font-mono text-[#71717A] shrink-0 font-bold">0 dona</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comprehensive Product Sales Table */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 shadow-lg space-y-4">
        {/* Table Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#FAFAFA] flex items-center gap-2">
              <span>Barcha Mahsulotlar Sotuv Hisoboti</span>
              <span className="text-xs bg-[#242424] text-[#A1A1AA] px-2.5 py-0.5 rounded-full">
                {filteredProducts.length} ta mahsulot
              </span>
            </h3>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Qaysi mahsulotdan qancha ketdi, umumiy tushum, tannarx va sof foydasi
            </p>
          </div>

          {/* Product Category & Velocity Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-1 flex gap-1 text-xs">
              {[
                { id: 'all', label: 'Barchasi' },
                { id: 'fast', label: '🔥 Tezkor' },
                { id: 'slow', label: '🐢 Sekin' },
                { id: 'zero', label: '⭕ Nol' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveProductTab(t.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    activeProductTab === t.id
                      ? 'bg-[#F59E0B] text-black shadow-sm'
                      : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-[#141414] border border-[#2E2E2E] rounded-xl px-3 py-1.5 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
            >
              <option value="count">Saralash: Soni bo'yicha</option>
              <option value="revenue">Saralash: Aylanma bo'yicha</option>
              <option value="profit">Saralash: Sof foyda bo'yicha</option>
            </select>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Mahsulot nomi yoki toifasi bo'yicha qidirish..."
              className="w-full bg-[#121212] border border-[#2A2A2A] rounded-xl pl-9 pr-3 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-[#121212] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B] sm:w-48"
          >
            <option value="all">Barcha kategoriyalar</option>
            {report?.categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#2A2A2A] text-[#A1A1AA] uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Mahsulot</th>
                <th className="py-3 px-3">Toifa</th>
                <th className="py-3 px-3 text-center">Ketgan Soni</th>
                <th className="py-3 px-3 text-right">Dona Narxi</th>
                <th className="py-3 px-3 text-right">Tan Narxi</th>
                <th className="py-3 px-3 text-right">Jami Tushum</th>
                <th className="py-3 px-3 text-right">Jami Tan Narx</th>
                <th className="py-3 px-3 text-right">Sof Foyda</th>
                <th className="py-3 px-3 text-center">Tezligi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242424]">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i}>
                    <td colSpan={9} className="py-3 px-3"><Skeleton className="h-8 w-full" /></td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#A1A1AA]">
                    Mos keluvchi mahsulotlar topilmadi
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-[#1F1F1F]/60 transition-colors">
                    {/* Name + thumbnail */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        {p.image_url ? (
                          <img
                            src={getImageUrl(p.image_url) || ''}
                            alt={p.name}
                            className="w-8 h-8 rounded-lg object-cover bg-[#222]"
                            onError={e => {
                              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&fit=crop';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-[#242424] flex items-center justify-center text-sm">
                            🍽️
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-[#FAFAFA]">{p.name}</p>
                          <p className="text-[10px] text-[#71717A]">{p.share_of_sales}% aylanma ulushi</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 text-[#A1A1AA]">
                      <span className="flex items-center gap-1">
                        <span>{p.category_icon}</span>
                        <span>{p.category_name}</span>
                      </span>
                    </td>

                    {/* Sold count */}
                    <td className="py-3 px-3 text-center">
                      <span className={`font-bold px-2.5 py-1 rounded-full text-xs ${
                        p.sold_count >= 5
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : p.sold_count >= 1
                          ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30'
                          : 'bg-[#262626] text-[#71717A]'
                      }`}>
                        {p.sold_count} dona
                      </span>
                    </td>

                    {/* Unit Price */}
                    <td className="py-3 px-3 text-right font-medium text-[#FAFAFA]">
                      {formatPrice(p.price)}
                    </td>

                    {/* Unit Cost */}
                    <td className="py-3 px-3 text-right font-medium text-[#A1A1AA]">
                      {formatPrice(p.cost_price)}
                    </td>

                    {/* Total Turnover */}
                    <td className="py-3 px-3 text-right font-bold text-[#F59E0B]">
                      {formatPrice(p.total_turnover)}
                    </td>

                    {/* Total Cost */}
                    <td className="py-3 px-3 text-right text-rose-400 font-mono">
                      {formatPrice(p.total_cost)}
                    </td>

                    {/* Net Profit */}
                    <td className="py-3 px-3 text-right">
                      <span className={`font-bold ${p.total_profit > 0 ? 'text-emerald-400' : 'text-[#71717A]'}`}>
                        {p.total_profit > 0 ? `+${formatPrice(p.total_profit)}` : '0 so\'m'}
                      </span>
                      <span className="block text-[10px] text-[#71717A]">{p.profit_margin}% marja</span>
                    </td>

                    {/* Velocity badge */}
                    <td className="py-3 px-3 text-center">
                      {p.velocity === 'fast' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          🚀 Tezkor
                        </span>
                      )}
                      {p.velocity === 'normal' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                          ⚡ O'rtacha
                        </span>
                      )}
                      {p.velocity === 'slow' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          🐢 Sekin
                        </span>
                      )}
                      {p.velocity === 'zero' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#262626] text-[#71717A]">
                          ⭕ Nol
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
