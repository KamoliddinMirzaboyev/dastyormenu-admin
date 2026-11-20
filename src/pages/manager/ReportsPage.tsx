import React, { useState, useEffect, useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  DollarSign, TrendingUp, Layers, Users, Wallet,
  Calendar, Search, Printer
} from 'lucide-react';
import { reportService, ReportPeriod, ComprehensiveReport } from '../../lib/reportService';
import { formatPrice, getImageUrl } from '../../lib/types';
import { Skeleton } from '../../components/UI/LoadingSkeleton';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
};

// Custom tooltip for Reports timeline chart
const TimelineTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (active && payload && payload.length) {
    const turnover = payload.find(p => p.dataKey === 'turnover')?.value || 0;
    const expenses = payload.find(p => p.dataKey === 'expenses')?.value || 0;
    const profit = turnover - expenses;

    return (
      <div className="bg-[#181818] border border-[#2E2E2E] rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[180px]">
        <p className="font-bold text-[#FAFAFA] border-b border-[#282828] pb-1">{label}</p>
        <div className="flex justify-between items-center text-[#A1A1AA]">
          <span>Aylanma:</span>
          <span className="font-semibold text-[#FAFAFA]">{formatPrice(turnover)}</span>
        </div>
        <div className="flex justify-between items-center text-[#71717A]">
          <span>Xarajatlar & Tan narx:</span>
          <span className="font-mono text-[#A1A1AA]">{formatPrice(expenses)}</span>
        </div>
        <div className="flex justify-between items-center text-[#FAFAFA] pt-1 border-t border-[#282828] font-bold">
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

    if (activeProductTab === 'fast') {
      list = list.filter(p => p.velocity === 'fast');
    } else if (activeProductTab === 'slow') {
      list = list.filter(p => p.velocity === 'slow');
    } else if (activeProductTab === 'zero') {
      list = list.filter(p => p.velocity === 'zero');
    }

    if (selectedCategory !== 'all') {
      list = list.filter(p => p.category_id === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.category_name.toLowerCase().includes(q));
    }

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
            <span className="text-xs bg-[#222222] text-[#A1A1AA] border border-[#2E2E2E] px-3 py-1 rounded-full font-medium">
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
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePeriodChange(tab.id as ReportPeriod)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  period === tab.id
                    ? 'bg-[#2E2E2E] text-[#FAFAFA] shadow-sm'
                    : 'text-[#71717A] hover:text-[#FAFAFA]'
                }`}
              >
                {tab.label}
              </motion.button>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handlePrint}
            className="bg-[#1E1E1E] hover:bg-[#282828] border border-[#2E2E2E] text-[#FAFAFA] px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Printer size={14} className="text-[#A1A1AA]" />
            <span>Chop etish</span>
          </motion.button>
        </div>
      </div>

      {/* Custom Date Range Picker bar (when custom is active) */}
      {showCustomPicker && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex flex-wrap items-center gap-4 text-xs"
        >
          <span className="font-medium text-[#FAFAFA] flex items-center gap-1.5">
            <Calendar size={14} className="text-[#A1A1AA]" />
            <span>Oraliq sanani belgilang:</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[#71717A]">Dan:</span>
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="bg-[#121212] border border-[#2E2E2E] rounded-lg px-3 py-1.5 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#71717A]">Gacha:</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="bg-[#121212] border border-[#2E2E2E] rounded-lg px-3 py-1.5 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
            />
          </div>
        </motion.div>
      )}

      {/* 5 Financial Overview KPI Cards (Clean, Uniform Monochrome) */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5"
      >
        {/* 1. Jami Aylanma */}
        <motion.div
          variants={cardVariant}
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 hover:border-[#383838] transition-colors shadow-sm"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-[#A1A1AA]">Jami Aylanma</span>
            <div className="w-8 h-8 rounded-lg bg-[#222222] border border-[#2E2E2E] flex items-center justify-center text-[#A1A1AA]">
              <DollarSign size={15} />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-7 w-28" />
          ) : (
            <div>
              <p className="text-xl font-bold text-[#FAFAFA] tracking-tight">
                {formatPrice(fin?.totalTurnover || 0)}
              </p>
              <p className="text-[11px] text-[#71717A] mt-1.5">
                {fin?.orderCount || 0} buyurtma • {report?.totalItemsSold || 0} taom
              </p>
            </div>
          )}
        </motion.div>

        {/* 2. Mahsulotlar Tan Narxi */}
        <motion.div
          variants={cardVariant}
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 hover:border-[#383838] transition-colors shadow-sm"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-[#A1A1AA]">Mahsulot Tan Narxi</span>
            <div className="w-8 h-8 rounded-lg bg-[#222222] border border-[#2E2E2E] flex items-center justify-center text-[#A1A1AA]">
              <Layers size={15} />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-7 w-28" />
          ) : (
            <div>
              <p className="text-xl font-bold text-[#FAFAFA] tracking-tight">
                {formatPrice(fin?.totalCostPrice || 0)}
              </p>
              <p className="text-[11px] text-[#71717A] mt-1.5">
                Yalpi foyda: {formatPrice(fin?.grossProfit || 0)}
              </p>
            </div>
          )}
        </motion.div>

        {/* 3. Ish Haqi & Maoshlar */}
        <motion.div
          variants={cardVariant}
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 hover:border-[#383838] transition-colors shadow-sm"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-[#A1A1AA]">Ish Haqi & Maoshlar</span>
            <div className="w-8 h-8 rounded-lg bg-[#222222] border border-[#2E2E2E] flex items-center justify-center text-[#A1A1AA]">
              <Users size={15} />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-7 w-28" />
          ) : (
            <div>
              <p className="text-xl font-bold text-[#FAFAFA] tracking-tight">
                {formatPrice(fin?.totalSalaries || 0)}
              </p>
              <p className="text-[11px] text-[#71717A] mt-1.5">
                Fond: {formatPrice(fin?.totalPayrollFund || 0)}/oy
              </p>
            </div>
          )}
        </motion.div>

        {/* 4. Boshqa Xarajatlar */}
        <motion.div
          variants={cardVariant}
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 hover:border-[#383838] transition-colors shadow-sm"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-[#A1A1AA]">Operatsion Xarajatlar</span>
            <div className="w-8 h-8 rounded-lg bg-[#222222] border border-[#2E2E2E] flex items-center justify-center text-[#A1A1AA]">
              <Wallet size={15} />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-7 w-28" />
          ) : (
            <div>
              <p className="text-xl font-bold text-[#FAFAFA] tracking-tight">
                {formatPrice(fin?.otherExpenses || 0)}
              </p>
              <p className="text-[11px] text-[#71717A] mt-1.5">
                Ijara, kommunal, xo'jalik
              </p>
            </div>
          )}
        </motion.div>

        {/* 5. Sof Foyda */}
        <motion.div
          variants={cardVariant}
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 hover:border-[#383838] transition-colors shadow-sm"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-[#A1A1AA]">Sof Foyda</span>
            <div className="w-8 h-8 rounded-lg bg-[#222222] border border-[#2E2E2E] flex items-center justify-center text-[#A1A1AA]">
              <TrendingUp size={15} />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-7 w-28" />
          ) : (
            <div>
              <p className="text-xl font-bold text-[#FAFAFA] tracking-tight">
                {formatPrice(fin?.netProfit || 0)}
              </p>
              <p className="text-[11px] text-[#71717A] mt-1.5">
                Rentabellik: {fin?.profitMargin}% marja
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Timeline Chart and Expense Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Timeline Chart (7 cols) */}
        <div className="lg:col-span-7 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#FAFAFA]">Aylanma va Xarajatlar Dinamikasi</h3>
              <p className="text-xs text-[#71717A]">Belgilangan davr bo'yicha kunlik ko'rsatkichlar</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                <span className="text-[#A1A1AA]">Aylanma</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#555555]" />
                <span className="text-[#71717A]">Xarajatlar & Tan narx</span>
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
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#71717A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#71717A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
                <XAxis dataKey="day" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#71717A', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${Math.round(v / 100000000)}M`}
                />
                <Tooltip content={<TimelineTooltip />} />
                <Area type="monotone" dataKey="turnover" stroke="#F59E0B" strokeWidth={2} fill="url(#turnoverGrad)" />
                <Area type="monotone" dataKey="expenses" stroke="#71717A" strokeWidth={1.5} fill="url(#expensesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Right: Category Revenue Share & Expenses Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#FAFAFA]">Xarajatlar va Tannarx Taqsimoti</h3>
              <span className="text-xs text-[#71717A]">Jami: {formatPrice(fin?.totalExpenses || 0)}</span>
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
                    <div className="h-1.5 bg-[#242424] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#4A4A4A]"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#242424] mt-4 flex items-center justify-between text-xs text-[#71717A]">
            <span>O'rtacha chek: <strong className="text-[#FAFAFA]">{formatPrice(fin?.averageCheck || 0)}</strong></span>
            <span>Jami stollar: <strong className="text-[#FAFAFA]">{fin?.customerCount || 0} ta</strong></span>
          </div>
        </div>
      </div>

      {/* Product Highlights: Fast-Moving vs Slow-Moving & Zero Sales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Fast-Moving Card */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
              <span>🔥</span>
              <span>Ko'p Ketayotgan Taomlar</span>
            </h3>
            <span className="text-[11px] bg-[#242424] text-[#FAFAFA] border border-[#2E2E2E] px-2 py-0.5 rounded-full font-medium">
              Top sotuvlar
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (report?.topFastMoving || []).length === 0 ? (
            <p className="text-xs text-[#71717A] py-6 text-center">Ma'lumotlar yo'q</p>
          ) : (
            <div className="space-y-2.5">
              {report?.topFastMoving.slice(0, 5).map((item, idx) => (
                <div key={item.id} className="p-2.5 bg-[#141414] rounded-xl border border-[#242424] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs shrink-0 font-bold text-[#A1A1AA]">
                      {idx + 1}.
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#FAFAFA] truncate">{item.name}</p>
                      <p className="text-[10px] text-[#71717A]">{item.category_name} • {item.share_of_sales}% ulush</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-[#FAFAFA] block">{item.sold_count} dona</span>
                    <span className="text-[10px] text-[#71717A] block">+{formatPrice(item.total_profit)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Slow-Moving Card */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
              <span>🐢</span>
              <span>Sekin Ketayotgan Taomlar</span>
            </h3>
            <span className="text-[11px] bg-[#242424] text-[#A1A1AA] border border-[#2E2E2E] px-2 py-0.5 rounded-full font-medium">
              Kam sotilgan (1-2 ta)
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (report?.slowMoving || []).length === 0 ? (
            <p className="text-xs text-[#71717A] py-6 text-center">Barcha taomlar yaxshi sotilmoqda</p>
          ) : (
            <div className="space-y-2.5">
              {report?.slowMoving.slice(0, 5).map(item => (
                <div key={item.id} className="p-2.5 bg-[#141414] rounded-xl border border-[#242424] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#FAFAFA] truncate">{item.name}</p>
                    <p className="text-[10px] text-[#71717A]">Narxi: {formatPrice(item.price)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-[#FAFAFA] block">{item.sold_count} dona</span>
                    <span className="text-[10px] text-[#71717A] block">{formatPrice(item.total_turnover)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zero Sales Card */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
              <span>⭕</span>
              <span>Umuman Sotilmagan</span>
            </h3>
            <span className="text-[11px] bg-[#1F1F1F] text-[#71717A] border border-[#2A2A2A] px-2 py-0.5 rounded-full font-medium">
              0 ta sotuv
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (report?.zeroSales || []).length === 0 ? (
            <p className="text-xs text-[#71717A] py-6 text-center">Har bir taomdan buyurtma olingan</p>
          ) : (
            <div className="space-y-2.5">
              {report?.zeroSales.slice(0, 5).map(item => (
                <div key={item.id} className="p-2.5 bg-[#141414] rounded-xl border border-[#242424] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#FAFAFA] truncate">{item.name}</p>
                    <p className="text-[10px] text-[#71717A]">Tavsiya: Narxini yoki menyu o'rnini qayta ko'ring</p>
                  </div>
                  <span className="text-xs font-mono text-[#555] shrink-0 font-bold">0 dona</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comprehensive Product Sales Table */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 shadow-sm space-y-4">
        {/* Table Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#FAFAFA] flex items-center gap-2">
              <span>Barcha Mahsulotlar Sotuv Hisoboti</span>
              <span className="text-xs bg-[#242424] text-[#A1A1AA] px-2.5 py-0.5 rounded-full">
                {filteredProducts.length} ta mahsulot
              </span>
            </h3>
            <p className="text-xs text-[#71717A] mt-0.5">
              Qaysi mahsulotdan qancha ketdi, umumiy tushum, tannarx va sof foydasi
            </p>
          </div>

          {/* Product Category & Velocity Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-1 flex gap-1 text-xs">
              {[
                { id: 'all', label: 'Barchasi' },
                { id: 'fast', label: 'Tezkor' },
                { id: 'slow', label: 'Sekin' },
                { id: 'zero', label: 'Nol' },
              ].map(t => (
                <motion.button
                  key={t.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveProductTab(t.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    activeProductTab === t.id
                      ? 'bg-[#2E2E2E] text-[#FAFAFA]'
                      : 'text-[#71717A] hover:text-[#FAFAFA]'
                  }`}
                >
                  {t.label}
                </motion.button>
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
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Mahsulot nomi bo'yicha qidirish..."
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
              <tr className="border-b border-[#242424] text-[#71717A] uppercase tracking-wider text-[10px]">
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
            <tbody className="divide-y divide-[#202020]">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i}>
                    <td colSpan={9} className="py-3 px-3"><Skeleton className="h-8 w-full" /></td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#71717A]">
                    Mos keluvchi mahsulotlar topilmadi
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-[#181818] transition-colors">
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
                          <div className="w-8 h-8 rounded-lg bg-[#242424] flex items-center justify-center text-xs">
                            🍽️
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-[#FAFAFA]">{p.name}</p>
                          <p className="text-[10px] text-[#71717A]">{p.share_of_sales}% ulush</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 text-[#71717A]">
                      <span className="flex items-center gap-1">
                        <span>{p.category_icon}</span>
                        <span>{p.category_name}</span>
                      </span>
                    </td>

                    {/* Sold count */}
                    <td className="py-3 px-3 text-center">
                      <span className="font-semibold text-xs text-[#FAFAFA] bg-[#222222] border border-[#2E2E2E] px-2.5 py-0.5 rounded-lg inline-block">
                        {p.sold_count} dona
                      </span>
                    </td>

                    {/* Unit Price */}
                    <td className="py-3 px-3 text-right font-medium text-[#FAFAFA]">
                      {formatPrice(p.price)}
                    </td>

                    {/* Unit Cost */}
                    <td className="py-3 px-3 text-right font-medium text-[#71717A]">
                      {formatPrice(p.cost_price)}
                    </td>

                    {/* Total Turnover */}
                    <td className="py-3 px-3 text-right font-bold text-[#FAFAFA]">
                      {formatPrice(p.total_turnover)}
                    </td>

                    {/* Total Cost */}
                    <td className="py-3 px-3 text-right text-[#71717A] font-mono">
                      {formatPrice(p.total_cost)}
                    </td>

                    {/* Net Profit */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-semibold text-[#FAFAFA]">
                        {p.total_profit > 0 ? `+${formatPrice(p.total_profit)}` : '0 so\'m'}
                      </span>
                      <span className="block text-[10px] text-[#71717A]">{p.profit_margin}% marja</span>
                    </td>

                    {/* Velocity badge */}
                    <td className="py-3 px-3 text-center">
                      {p.velocity === 'fast' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#242424] text-[#FAFAFA] border border-[#333]">
                          Tezkor
                        </span>
                      )}
                      {p.velocity === 'normal' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#222222] text-[#A1A1AA] border border-[#2E2E2E]">
                          O'rtacha
                        </span>
                      )}
                      {p.velocity === 'slow' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#1C1C1C] text-[#71717A] border border-[#262626]">
                          Sekin
                        </span>
                      )}
                      {p.velocity === 'zero' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#141414] text-[#555] border border-[#222]">
                          Nol
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
