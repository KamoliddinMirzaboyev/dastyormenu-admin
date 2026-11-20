import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  DollarSign, TrendingUp, Plus, Clock,
  ArrowRight, Armchair, RefreshCw
} from 'lucide-react';
import StatusBadge from '../../components/UI/StatusBadge';
import { Order, Table, UserProfile, Menu, formatPrice } from '../../lib/types';
import { Skeleton } from '../../components/UI/LoadingSkeleton';
import { orderService } from '../../lib/orderService';
import { tableService } from '../../lib/tableService';
import { staffService } from '../../lib/staffService';
import { menuService } from '../../lib/menuService';
import { useRealtimeOrders } from '../../hooks/useRealtime';
import { AddExpenseModal } from '../../components/Finance/AddExpenseModal';
import { NewOrderModal } from '../../components/Orders/NewOrderModal';
import { useToast } from '../../lib/toast';

const HOURS = Array.from({ length: 14 }, (_, i) => `${i + 10}:00`);

// Hourly Tooltip
const HourlyTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#181818] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs shadow-xl">
        <p className="text-[#A1A1AA] mb-0.5">{label}</p>
        <p className="text-[#FAFAFA] font-bold">{payload[0].value} ta buyurtma</p>
      </div>
    );
  }
  return null;
};

// Motion animation variants
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: 'easeOut' },
  },
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { success } = useToast();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);

  // Modals
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [oRes, tRes, sRes, mRes] = await Promise.all([
        orderService.getOrders(),
        tableService.getTables(),
        staffService.getStaff(),
        menuService.getMenus(),
      ]);
      if (oRes.success && oRes.data) setOrders(oRes.data);
      if (tRes.success && tRes.data) setTables(tRes.data);
      if (sRes.success && sRes.data) setStaff(sRes.data);
      if (mRes.success && mRes.data) setMenus(mRes.data);
    } catch (e) {
      console.error('Dashboard loadData error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useRealtimeOrders({
    onInsert: () => loadData(),
    onUpdate: () => loadData(),
  });

  // Today's Date String
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Today's Orders
  const todayOrders = useMemo(() => {
    return orders.filter(o => o.created_at.startsWith(todayStr));
  }, [orders, todayStr]);

  // Today's completed orders
  const todayCompleted = useMemo(() => {
    return todayOrders.filter(o => o.status === 'completed');
  }, [todayOrders]);

  // Today's turnover
  const todayTurnover = useMemo(() => {
    return todayCompleted.reduce((sum, o) => sum + o.total_amount, 0);
  }, [todayCompleted]);

  // Average check today
  const averageCheck = useMemo(() => {
    return todayCompleted.length > 0 ? Math.round(todayTurnover / todayCompleted.length) : 0;
  }, [todayCompleted, todayTurnover]);

  // Active orders (pending, cooking, ready)
  const activeOrders = useMemo(() => {
    return orders.filter(o => ['pending', 'cooking', 'ready'].includes(o.status));
  }, [orders]);

  // Occupied tables
  const occupiedTableIds = useMemo(() => {
    return new Set(activeOrders.map(o => o.table_id));
  }, [activeOrders]);

  // Hourly Data calculation for today
  const hourlyData = useMemo(() => {
    const countByHour: Record<string, number> = {};
    todayOrders.forEach(o => {
      const h = new Date(o.created_at).getHours();
      const key = `${h}:00`;
      countByHour[key] = (countByHour[key] || 0) + 1;
    });

    return HOURS.map(h => ({ hour: h, orders: countByHour[h] || 0 }));
  }, [todayOrders]);

  const maxHourly = Math.max(...hourlyData.map(d => d.orders), 1);

  const handleRefresh = () => {
    loadData();
    success("Ma'lumotlar yangilandi");
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    const res = await orderService.updateStatus(orderId, status);
    if (res.success) {
      success('Buyurtma holati yangilandi');
      loadData();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 pb-10"
    >
      {/* Top Welcome & Operational Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-xl font-bold text-[#FAFAFA] flex items-center gap-2">
            <span>Bugungi Tezkor Boshqaruv</span>
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" title="Jonli rejim" />
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Bugungi sotuvlar, faol buyurtmalar va zaldagi stollar holati
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Detailed Reports Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/manager/reports')}
            className="bg-[#1C1C1C] hover:bg-[#252525] border border-[#2E2E2E] text-[#FAFAFA] font-medium text-xs px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>To'liq Hisobotlar</span>
            <ArrowRight size={14} className="text-[#A1A1AA]" />
          </motion.button>

          {/* New Order Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowNewOrderModal(true)}
            className="bg-[#F59E0B] hover:bg-[#D97706] text-black font-semibold text-xs px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={16} />
            <span>Buyurtma Olish</span>
          </motion.button>

          {/* Add Expense Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAddExpense(true)}
            className="bg-[#1C1C1C] hover:bg-[#252525] border border-[#2E2E2E] text-[#FAFAFA] font-medium text-xs px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Plus size={14} className="text-[#A1A1AA]" />
            <span>Xarajat</span>
          </motion.button>

          {/* Refresh Data Button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleRefresh}
            title="Ma'lumotlarni yangilash"
            className="p-2 bg-[#1C1C1C] hover:bg-[#252525] border border-[#2E2E2E] rounded-xl text-[#71717A] hover:text-[#FAFAFA] transition-colors"
          >
            <RefreshCw size={15} />
          </motion.button>
        </div>
      </div>

      {/* 4 Clean Real-Time Operational Stat Cards for TODAY */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* 1. Bugungi Tushum */}
        <motion.div
          variants={cardVariant}
          whileHover={{ y: -2 }}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 hover:border-[#3A3A3A] transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-[#A1A1AA]">Bugungi Aylanma</span>
            <div className="w-8 h-8 rounded-lg bg-[#222222] border border-[#2E2E2E] flex items-center justify-center text-[#A1A1AA]">
              <DollarSign size={15} />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-7 w-28" />
          ) : (
            <div>
              <p className="text-xl font-bold text-[#FAFAFA] tracking-tight">
                {formatPrice(todayTurnover)}
              </p>
              <p className="text-[11px] text-[#71717A] mt-1.5">
                {todayCompleted.length} ta yopilgan buyurtma
              </p>
            </div>
          )}
        </motion.div>

        {/* 2. Oshxona & Faol Buyurtmalar */}
        <motion.div
          variants={cardVariant}
          whileHover={{ y: -2 }}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 hover:border-[#3A3A3A] transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-[#A1A1AA]">Oshxona & Jarayonda</span>
            <div className="w-8 h-8 rounded-lg bg-[#222222] border border-[#2E2E2E] flex items-center justify-center text-[#A1A1AA]">
              <Clock size={15} />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-7 w-28" />
          ) : (
            <div>
              <p className="text-xl font-bold text-[#FAFAFA] tracking-tight">
                {activeOrders.length} ta buyurtma
              </p>
              <p className="text-[11px] text-[#71717A] mt-1.5">
                Kutilmoqda yoki tayyorlanmoqda
              </p>
            </div>
          )}
        </motion.div>

        {/* 3. Stollar Bandligi */}
        <motion.div
          variants={cardVariant}
          whileHover={{ y: -2 }}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 hover:border-[#3A3A3A] transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-[#A1A1AA]">Zal & Stollar Bandligi</span>
            <div className="w-8 h-8 rounded-lg bg-[#222222] border border-[#2E2E2E] flex items-center justify-center text-[#A1A1AA]">
              <Armchair size={15} />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-7 w-28" />
          ) : (
            <div>
              <p className="text-xl font-bold text-[#FAFAFA] tracking-tight">
                {occupiedTableIds.size} / {tables.length} band
              </p>
              <p className="text-[11px] text-[#71717A] mt-1.5">
                {tables.length - occupiedTableIds.size} ta stol bo'sh
              </p>
            </div>
          )}
        </motion.div>

        {/* 4. O'rtacha Chek */}
        <motion.div
          variants={cardVariant}
          whileHover={{ y: -2 }}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 hover:border-[#3A3A3A] transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-[#A1A1AA]">O'rtacha Chek (Bugun)</span>
            <div className="w-8 h-8 rounded-lg bg-[#222222] border border-[#2E2E2E] flex items-center justify-center text-[#A1A1AA]">
              <TrendingUp size={15} />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-7 w-28" />
          ) : (
            <div>
              <p className="text-xl font-bold text-[#FAFAFA] tracking-tight">
                {formatPrice(averageCheck)}
              </p>
              <p className="text-[11px] text-[#71717A] mt-1.5">
                Bitta stol o'rtacha tushumi
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Main Operational 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Hourly Activity & Tables Quick Grid */}
        <div className="lg:col-span-7 space-y-5">
          {/* Today's Peak Hours Activity Bar Chart */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#FAFAFA]">Bugungi Soatlik Bandlik</h3>
                <p className="text-xs text-[#71717A]">Mijozlar eng ko'p keladigan vaqtlar</p>
              </div>
              <span className="text-[11px] bg-[#222222] text-[#A1A1AA] px-2.5 py-1 rounded-lg font-medium border border-[#2E2E2E]">
                Maks: {maxHourly} ta
              </span>
            </div>

            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
                  <XAxis dataKey="hour" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="orders" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<HourlyTooltip />} />
                  <Bar dataKey="orders" radius={[4, 4, 0, 0]} fill="#262626">
                    {hourlyData.map((entry, index) => (
                      <rect
                        key={index}
                        fill={entry.orders === maxHourly && entry.orders > 0 ? '#F59E0B' : '#2A2A2A'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Quick Table Grid (Interactive: 1-click Order Taking) */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h3 className="text-sm font-bold text-[#FAFAFA]">Stollar Xaritasi</h3>
                <p className="text-xs text-[#71717A]">Stol ustiga bosib buyurtma oling</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-[#71717A]">
                  <span className="w-2 h-2 rounded-full bg-[#444444]" /> Bo'sh
                </span>
                <span className="flex items-center gap-1.5 text-[#A1A1AA]">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Band
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {tables.map(table => {
                const isOccupied = occupiedTableIds.has(table.id);
                return (
                  <motion.button
                    key={table.id}
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedTableForOrder(table.id);
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-colors ${
                      isOccupied
                        ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#FAFAFA]'
                        : 'bg-[#141414] border-[#242424] hover:border-[#383838] text-[#A1A1AA]'
                    }`}
                  >
                    <span className="text-base font-bold text-[#FAFAFA]">{table.table_number}</span>
                    <span className={`text-[10px] font-semibold mt-0.5 ${isOccupied ? 'text-[#F59E0B]' : 'text-[#71717A]'}`}>
                      {isOccupied ? 'Band' : 'Bo\'sh'}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live Orders Stream & Quick Link to Reports */}
        <div className="lg:col-span-5 space-y-5">
          {/* Live Active Orders Stream */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
                  <span>Jonli Buyurtmalar Oqimi</span>
                  {activeOrders.length > 0 && (
                    <span className="text-xs bg-[#242424] text-[#FAFAFA] border border-[#333] px-2 py-0.5 rounded-full font-semibold">
                      {activeOrders.length}
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => navigate('/manager/orders')}
                  className="text-xs text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors font-medium"
                >
                  Barchasi ➔
                </button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : orders.length === 0 ? (
                <p className="text-xs text-[#71717A] text-center py-10">Buyurtmalar mavjud emas</p>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  <AnimatePresence initial={false}>
                    {orders.slice(0, 6).map(order => {
                      const mins = Math.round((Date.now() - new Date(order.created_at).getTime()) / 60000);
                      const tableNum = (order.table as { table_number?: number } | undefined)?.table_number ?? '?';
                      const itemsText = (order.order_items || []).map(i => `${i.menu_name} (x${i.quantity})`).join(', ');

                      return (
                        <motion.div
                          key={order.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="p-3 bg-[#141414] rounded-xl border border-[#242424] hover:border-[#333333] transition-colors space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-[#222222] text-[#FAFAFA] text-xs font-bold flex items-center justify-center">
                                {tableNum}
                              </span>
                              <span className="text-xs font-semibold text-[#FAFAFA]">{tableNum}-stol</span>
                              <span className="text-[10px] text-[#71717A]">• {mins < 1 ? 'Hozirgina' : `${mins}m oldin`}</span>
                            </div>
                            <StatusBadge status={order.status} />
                          </div>

                          <p className="text-[11px] text-[#A1A1AA] line-clamp-1 truncate" title={itemsText}>
                            {itemsText || 'Buyurtma tarkibi'}
                          </p>

                          <div className="flex items-center justify-between pt-1 border-t border-[#202020]">
                            <span className="text-xs font-semibold text-[#FAFAFA]">{formatPrice(order.total_amount)}</span>
                            
                            {/* Clean Workflow Action button */}
                            {order.status === 'pending' && (
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleUpdateOrderStatus(order.id, 'cooking')}
                                className="text-[10px] bg-[#222222] hover:bg-[#2A2A2A] text-[#FAFAFA] border border-[#333] px-2.5 py-1 rounded-lg font-medium transition-colors"
                              >
                                Oshxonaga
                              </motion.button>
                            )}
                            {order.status === 'cooking' && (
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                                className="text-[10px] bg-[#F59E0B]/15 hover:bg-[#F59E0B]/25 text-[#F59E0B] border border-[#F59E0B]/30 px-2.5 py-1 rounded-lg font-medium transition-colors"
                              >
                                Tayyor
                              </motion.button>
                            )}
                            {order.status === 'ready' && (
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                                className="text-[10px] bg-[#222222] hover:bg-[#2A2A2A] text-[#FAFAFA] border border-[#333] px-2.5 py-1 rounded-lg font-medium transition-colors"
                              >
                                Yopish
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Banner: Jump to Detailed Reports */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
            onClick={() => navigate('/manager/reports')}
            className="cursor-pointer bg-[#1A1A1A] hover:bg-[#202020] border border-[#2A2A2A] hover:border-[#383838] rounded-xl p-5 transition-all flex items-center justify-between shadow-sm group"
          >
            <div>
              <p className="text-xs font-semibold text-[#FAFAFA] flex items-center gap-1.5">
                <span>To'liq Moliya & Mahsulotlar Tahlili</span>
                <ArrowRight size={13} className="text-[#71717A] group-hover:translate-x-1 transition-transform" />
              </p>
              <p className="text-[11px] text-[#71717A] mt-1">
                Davriy aylanma, tan narxlar, oylik maoshlar, ko'p va sekin ketayotgan taomlar
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#222222] border border-[#2E2E2E] flex items-center justify-center text-[#A1A1AA] shrink-0 ml-3">
              <TrendingUp size={16} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Add Expense Modal */}
      <AddExpenseModal
        open={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        onExpenseAdded={loadData}
      />

      {/* New Order Modal (Waiter Take Order) */}
      {(showNewOrderModal || selectedTableForOrder) && (
        <NewOrderModal
          open={showNewOrderModal || !!selectedTableForOrder}
          onClose={() => {
            setShowNewOrderModal(false);
            setSelectedTableForOrder(null);
          }}
          tables={tables}
          staff={staff}
          menu={menus}
          initialTableId={selectedTableForOrder || undefined}
          onOrderCreated={loadData}
        />
      )}
    </motion.div>
  );
};

export default DashboardPage;
