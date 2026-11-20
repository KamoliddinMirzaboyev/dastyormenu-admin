import React, { useState, useCallback, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { X, RefreshCw, Plus, CheckCircle, ChefHat, Bell, Check, Ban } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { useRealtimeOrders } from '../../hooks/useRealtime';
import { orderService } from '../../lib/orderService';
import { tableService } from '../../lib/tableService';
import { staffService } from '../../lib/staffService';
import { menuService } from '../../lib/menuService';
import { useToast } from '../../lib/toast';
import { Order, OrderStatus, Table, UserProfile, Menu, formatPrice } from '../../lib/types';
import StatusBadge from '../../components/UI/StatusBadge';
import { TableSkeleton } from '../../components/UI/LoadingSkeleton';
import { NewOrderModal } from '../../components/Orders/NewOrderModal';

const STATUS_TABS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all',       label: 'Barchasi' },
  { key: 'pending',   label: 'Kutilmoqda' },
  { key: 'cooking',   label: 'Tayyorlanmoqda' },
  { key: 'ready',     label: 'Tayyor' },
  { key: 'completed', label: 'Tugallangan' },
  { key: 'cancelled', label: 'Bekor qilingan' },
];

const STATUS_NEXT: Partial<Record<OrderStatus, { next: OrderStatus; label: string; icon: React.ElementType }>> = {
  pending:   { next: 'cooking',   label: 'Qabul qilish (Oshxona)', icon: ChefHat },
  cooking:   { next: 'ready',     label: 'Tayyor bo\'ldi',        icon: Bell },
  ready:     { next: 'completed', label: 'Mijozga yetkazildi',    icon: Check },
};

const OrdersPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [activeStatus, setActiveStatus] = useState<OrderStatus | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);

  // Aux state for NewOrderModal
  const [tables, setTables] = useState<Table[]>([]);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [menu, setMenu] = useState<Menu[]>([]);

  const { orders, loading, refetch } = useOrders({ status: activeStatus, date: selectedDate });

  const loadAuxData = useCallback(async () => {
    const [tRes, sRes, mRes] = await Promise.all([
      tableService.getTables(),
      staffService.getStaff(),
      menuService.getMenus(),
    ]);
    if (tRes.success && tRes.data) setTables(tRes.data);
    if (sRes.success && sRes.data) setStaff(sRes.data);
    if (mRes.success && mRes.data) setMenu(mRes.data);
  }, []);

  useEffect(() => {
    loadAuxData();
  }, [loadAuxData]);

  // Realtime
  const handleInsert = useCallback((order: Order) => {
    success(`Yangi buyurtma! ${(order.table as { table_number?: number } | undefined)?.table_number ?? ''}-stol`);
    refetch();
  }, [success, refetch]);

  const handleUpdate = useCallback(() => { 
    refetch(); 
  }, [refetch]);

  useRealtimeOrders({ onInsert: handleInsert, onUpdate: handleUpdate });

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);

    try {
      const response = await orderService.updateStatus(orderId, newStatus);

      if (response.success) {
        success('Status yangilandi');
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
        }
        refetch();
      } else {
        toastError(response.error?.message || 'Status yangilanmadi');
      }
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Status yangilanmadi');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatTime = (iso: string) => {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'Hozirgina';
    if (mins < 60) return `${mins} daqiqa oldin`;
    return `${Math.floor(mins / 60)}s ${mins % 60}m oldin`;
  };

  return (
    <div className="space-y-4">
      {/* Header Bar with Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#FAFAFA]">Buyurtmalar Boshqaruvi</h2>
          <p className="text-xs text-[#A1A1AA]">
            Ofitsiantlar buyurtmasi va jonli oshxona holati
          </p>
        </div>

        {/* Primary Action: New Order */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowNewOrderModal(true)}
          className="bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-[#F59E0B]/20 flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>+ Yangi Buyurtma Olish</span>
        </motion.button>
      </div>

      {/* Filters */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status tabs */}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_TABS.map(tab => (
              <motion.button
                key={tab.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveStatus(tab.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  activeStatus === tab.key
                    ? 'bg-[#F59E0B] text-black shadow-md shadow-[#F59E0B]/20'
                    : 'bg-[#242424] text-[#A1A1AA] hover:text-[#FAFAFA]'
                }`}
              >
                {tab.label}
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl px-3 py-1.5 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
            />
            <motion.button
              whileTap={{ rotate: 180 }}
              transition={{ duration: 0.2 }}
              onClick={refetch}
              title="Yangilash"
              className="p-2 bg-[#242424] hover:bg-[#333333] rounded-xl text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
            >
              <RefreshCw size={15} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-6"><TableSkeleton rows={6} cols={7} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2A2A2A] bg-[#141414]/50">
                  {['№', 'Stol', 'Ofitsiant', 'Taomlar', 'Summa', 'Holat', 'Vaqt', 'Harakatlar'].map(h => (
                    <th key={h} className="text-left py-3.5 px-4 text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-[#A1A1AA] text-sm">
                      <p className="font-semibold text-[#FAFAFA] mb-1">Buyurtmalar topilmadi</p>
                      <p className="text-xs text-[#71717A]">
                        Ushbu sana yoki holat bo'yicha buyurtma mavjud emas. Yuqoridagi "+ Yangi Buyurtma Olish" tugmasi orqali yangi buyurtma qo'shing.
                      </p>
                    </td>
                  </tr>
                ) : orders.map((order, idx) => {
                  const tableNum = (order.table as { table_number?: number } | undefined)?.table_number ?? '?';
                  const waiterName = (order.waiter as { full_name?: string } | undefined)?.full_name ?? '—';
                  const itemCount = order.order_items?.length ?? 0;
                  const nextAction = STATUS_NEXT[order.status];

                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: Math.min(idx * 0.03, 0.3) }}
                      className="border-b border-[#2A2A2A]/50 hover:bg-[#242424]/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-xs text-[#A1A1AA] font-mono">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <span className="w-8 h-8 bg-[#2A2A2A] border border-[#3A3A3A] rounded-xl inline-flex items-center justify-center text-xs font-bold text-[#F59E0B]">
                          {tableNum}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-[#FAFAFA]">{waiterName}</td>
                      <td className="py-3 px-4 text-sm text-[#A1A1AA]">{itemCount} ta taom</td>
                      <td className="py-3 px-4 text-sm font-bold text-[#FAFAFA]">{formatPrice(order.total_amount)}</td>
                      <td className="py-3 px-4"><StatusBadge status={order.status} /></td>
                      <td className="py-3 px-4 text-xs text-[#A1A1AA]">{formatTime(order.created_at)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileTap={{ scale: 0.92 }}
                            onClick={() => setSelectedOrder(order)}
                            className="text-xs bg-[#2A2A2A] hover:bg-[#333333] text-[#FAFAFA] px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            Ko'rish
                          </motion.button>
                          
                          {nextAction && (
                            <motion.button
                              whileTap={{ scale: 0.92 }}
                              onClick={() => updateStatus(order.id, nextAction.next)}
                              disabled={updatingId === order.id}
                              className="text-xs bg-[#F59E0B] hover:bg-[#D97706] text-black font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              {updatingId === order.id ? '...' : (
                                <>
                                  <nextAction.icon size={13} />
                                  <span>{nextAction.label.split(' ')[0]}</span>
                                </>
                              )}
                            </motion.button>
                          )}

                          {order.status !== 'completed' && order.status !== 'cancelled' && (
                            <motion.button
                              whileTap={{ scale: 0.88 }}
                              onClick={() => updateStatus(order.id, 'cancelled')}
                              title="Bekor qilish"
                              className="text-xs text-rose-400 hover:text-rose-300 p-1.5 rounded hover:bg-rose-500/10 transition-colors"
                            >
                              <Ban size={14} />
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <Dialog.Root open={!!selectedOrder} onOpenChange={open => !open && setSelectedOrder(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 z-50 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-base font-bold text-[#FAFAFA]">
                Buyurtma #{selectedOrder?.id?.slice(-6).toUpperCase()}
              </Dialog.Title>
              <Dialog.Close className="text-[#A1A1AA] hover:text-[#FAFAFA] p-1.5 rounded-lg hover:bg-[#2A2A2A]">
                <X size={18} />
              </Dialog.Close>
            </div>

            {selectedOrder && (
              <div className="space-y-4">
                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-[#121212] rounded-xl p-3 border border-[#2A2A2A]">
                    <p className="text-[#A1A1AA] text-xs mb-1">Stol va Ofitsiant</p>
                    <p className="text-[#FAFAFA] font-bold">
                      {(selectedOrder.table as { table_number?: number } | undefined)?.table_number ?? '?'}-stol
                    </p>
                    <p className="text-xs text-[#A1A1AA] mt-0.5">
                      {(selectedOrder.waiter as { full_name?: string } | undefined)?.full_name ?? 'Ofitsiant biriktirilmagan'}
                    </p>
                  </div>
                  <div className="bg-[#121212] rounded-xl p-3 border border-[#2A2A2A]">
                    <p className="text-[#A1A1AA] text-xs mb-1">Holat</p>
                    <div className="mt-1">
                      <StatusBadge status={selectedOrder.status} />
                    </div>
                  </div>
                  <div className="bg-[#121212] rounded-xl p-3 border border-[#2A2A2A]">
                    <p className="text-[#A1A1AA] text-xs mb-1">Jami to'lov</p>
                    <p className="text-[#F59E0B] font-extrabold text-base">{formatPrice(selectedOrder.total_amount)}</p>
                    <p className="text-[10px] text-[#A1A1AA]">+10% xizmat haqi: {formatPrice(selectedOrder.tip_amount || 0)}</p>
                  </div>
                  <div className="bg-[#121212] rounded-xl p-3 border border-[#2A2A2A]">
                    <p className="text-[#A1A1AA] text-xs mb-1">Buyurtma vaqti</p>
                    <p className="text-[#FAFAFA] font-medium">
                      {new Date(selectedOrder.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[10px] text-[#A1A1AA]">
                      {new Date(selectedOrder.created_at).toLocaleDateString('uz-UZ')}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="bg-[#121212] rounded-xl p-4 border border-[#2A2A2A]">
                  <p className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-3">
                    Buyurtma tarkibi ({selectedOrder.order_items?.length ?? 0} ta)
                  </p>
                  <div className="space-y-2">
                    {(selectedOrder.order_items ?? []).map(item => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-[#2A2A2A]/50 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-[#FAFAFA]">{item.menu_name}</p>
                          {item.modifications && (
                            <p className="text-xs text-[#F59E0B] italic">{item.modifications}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#FAFAFA]">{item.quantity} × {formatPrice(item.menu_price)}</p>
                          <p className="text-xs text-[#A1A1AA] font-semibold">{formatPrice(item.menu_price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Note */}
                {selectedOrder.customer_note && (
                  <div className="bg-[#121212] rounded-xl p-3 border border-[#2A2A2A]">
                    <p className="text-xs text-[#A1A1AA] mb-1 font-semibold">Mijoz istagi / Izoh</p>
                    <p className="text-sm text-[#FAFAFA] italic">{selectedOrder.customer_note}</p>
                  </div>
                )}

                {/* Action button */}
                {STATUS_NEXT[selectedOrder.status] && (
                  <button
                    onClick={() => updateStatus(selectedOrder.id, STATUS_NEXT[selectedOrder.status]!.next)}
                    disabled={updatingId === selectedOrder.id}
                    className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#F59E0B]/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    <span>
                      {updatingId === selectedOrder.id ? 'Yangilanmoqda...' : `→ ${STATUS_NEXT[selectedOrder.status]!.label}`}
                    </span>
                  </button>
                )}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* New Order Modal (Waiter Take Order) */}
      <NewOrderModal
        open={showNewOrderModal}
        onClose={() => setShowNewOrderModal(false)}
        tables={tables}
        staff={staff}
        menu={menu}
        onOrderCreated={refetch}
      />
    </div>
  );
};

export default OrdersPage;
