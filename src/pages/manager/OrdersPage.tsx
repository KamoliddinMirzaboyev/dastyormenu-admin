import React, { useState, useCallback, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { X, RefreshCw, Plus, CheckCircle, ChefHat, Bell, Check, Ban, Clock, User, UtensilsCrossed, MessageSquare, Eye, Receipt } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { useRealtimeOrders } from '../../hooks/useRealtime';
import { orderService } from '../../lib/orderService';
import { tableService } from '../../lib/tableService';
import { staffService } from '../../lib/staffService';
import { menuService } from '../../lib/menuService';
import { useToast } from '../../lib/toast';
import { Order, OrderStatus, Table, UserProfile, Menu, formatPrice } from '../../lib/types';
import StatusBadge from '../../components/UI/StatusBadge';
import { GridSkeleton } from '../../components/UI/LoadingSkeleton';
import ConfirmModal from '../../components/UI/ConfirmModal';
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
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
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
          <span>Yangi Buyurtma Olish</span>
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

      {/* Summary Strip */}
      {!loading && orders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3">
            <p className="text-[11px] text-[#71717A] font-medium">Jami buyurtmalar</p>
            <p className="text-lg font-bold text-[#FAFAFA] mt-0.5">{orders.length} ta</p>
          </div>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3">
            <p className="text-[11px] text-[#71717A] font-medium">Faol (jarayonda)</p>
            <p className="text-lg font-bold text-[#F59E0B] mt-0.5">
              {orders.filter(o => o.status === 'pending' || o.status === 'cooking' || o.status === 'ready').length} ta
            </p>
          </div>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3">
            <p className="text-[11px] text-[#71717A] font-medium">Tugallangan</p>
            <p className="text-lg font-bold text-emerald-400 mt-0.5">
              {orders.filter(o => o.status === 'completed').length} ta
            </p>
          </div>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3">
            <p className="text-[11px] text-[#71717A] font-medium">Umumiy summa</p>
            <p className="text-lg font-bold text-[#FAFAFA] mt-0.5">
              {formatPrice(orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.grand_total || o.total_amount || 0), 0))}
            </p>
          </div>
        </div>
      )}

      {/* Orders Card Grid */}
      {loading ? (
        <GridSkeleton count={6} />
      ) : orders.length === 0 ? (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl py-16 px-6 text-center shadow-lg">
          <Receipt size={36} className="text-[#3A3A3A] mx-auto mb-3" />
          <p className="font-semibold text-[#FAFAFA] text-sm mb-1">Buyurtmalar topilmadi</p>
          <p className="text-xs text-[#71717A]">
            Ushbu sana yoki holat bo'yicha buyurtma mavjud emas. Yuqoridagi "Yangi Buyurtma Olish" tugmasi orqali yangi buyurtma qo'shing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((order, idx) => {
            const tableNum = order.table_number ?? (order.table as { table_number?: number } | undefined)?.table_number ?? '?';
            const waiterName = order.waiter_name || (order.waiter as { full_name?: string } | undefined)?.full_name || 'Belgilanmagan';
            const rawItems = order.order_items && order.order_items.length > 0
              ? order.order_items.map(i => ({
                  id: i.id,
                  name: i.menu_name,
                  qty: i.quantity,
                  price: i.menu_price * i.quantity,
                  mod: i.modifications,
                }))
              : (order.items ?? []).map((i, k) => ({
                  id: i.id || String(k),
                  name: i.name || 'Taom',
                  qty: i.quantity || 1,
                  price: i.line_total ?? ((i.unit_price || 0) * (i.quantity || 1)),
                  mod: i.modifications,
                }));
            const totalQty = rawItems.reduce((s, i) => s + i.qty, 0);
            const nextAction = STATUS_NEXT[order.status];
            const exactTime = new Date(order.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
            const isPaid = order.payment_status === 'paid';
            const totalSum = order.grand_total || order.total_amount;

            const accentBorder =
              order.status === 'pending' ? 'border-t-2 border-t-[#F59E0B]' :
              order.status === 'cooking' ? 'border-t-2 border-t-sky-500' :
              order.status === 'ready' ? 'border-t-2 border-t-emerald-500' :
              order.status === 'cancelled' ? 'border-t-2 border-t-rose-500/70 opacity-80' :
              'border-t-2 border-t-[#3A3A3A]';

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: Math.min(idx * 0.03, 0.25) }}
                className={`bg-[#1A1A1A] border border-[#2A2A2A] ${accentBorder} rounded-xl p-4 flex flex-col justify-between gap-3.5 hover:border-[#3A3A3A] transition-colors shadow-md`}
              >
                {/* Top: Table + Order # + Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#242424] border border-[#333333] flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] uppercase text-[#71717A] font-semibold leading-none">Stol</span>
                      <span className="text-base font-bold text-[#F59E0B] leading-tight">{tableNum}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#FAFAFA]">Buyurtma #{idx + 1}</span>
                        {order.source && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#242424] text-[#A1A1AA] border border-[#2E2E2E]">
                            {order.source === 'customer' ? 'QR Menyu' : 'Ofitsiant'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#A1A1AA] mt-1">
                        <span className="flex items-center gap-1">
                          <User size={11} className="text-[#71717A]" />
                          <span>{waiterName}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} className="text-[#71717A]" />
                          <span>{exactTime} ({formatTime(order.created_at)})</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                {/* Middle: Items List */}
                <div className="bg-[#141414] border border-[#242424] rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-[#71717A] pb-1 border-b border-[#222222]">
                    <span className="flex items-center gap-1 font-semibold">
                      <UtensilsCrossed size={11} />
                      <span>Buyurtma tarkibi</span>
                    </span>
                    <span>{totalQty} ta pozitsiya</span>
                  </div>

                  {rawItems.length === 0 ? (
                    <p className="text-xs text-[#71717A] py-1">Taomlar ro'yxati mavjud emas</p>
                  ) : (
                    <div className="space-y-1">
                      {rawItems.slice(0, 4).map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs gap-2">
                          <div className="truncate text-[#E4E4E7]">
                            <span className="font-bold text-[#F59E0B] mr-1.5">{item.qty}x</span>
                            <span>{item.name}</span>
                            {item.mod && <span className="text-[10px] text-[#71717A] ml-1">({item.mod})</span>}
                          </div>
                          <span className="text-[#A1A1AA] font-mono shrink-0">{formatPrice(item.price)}</span>
                        </div>
                      ))}
                      {rawItems.length > 4 && (
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="text-[11px] text-[#F59E0B] hover:underline font-medium pt-0.5"
                        >
                          + yana {rawItems.length - 4} ta taom ko'rish
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Optional Customer Note */}
                {order.customer_note && (
                  <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 text-xs text-amber-200">
                    <MessageSquare size={13} className="text-[#F59E0B] shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{order.customer_note}</span>
                  </div>
                )}

                {/* Bottom: Total + Payment + Actions */}
                <div className="pt-2 border-t border-[#262626] flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[#FAFAFA]">{formatPrice(totalSum)}</span>
                      {order.payment_status && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                          isPaid
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                            : 'bg-[#242424] text-[#A1A1AA] border border-[#2E2E2E]'
                        }`}>
                          {isPaid ? "To'langan" : "To'lanmagan"}
                        </span>
                      )}
                    </div>
                    {order.tip_amount > 0 && (
                      <p className="text-[10px] text-[#71717A]">
                        Xizmat haqi: +{formatPrice(order.tip_amount)} ({order.tip_percentage}%)
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setSelectedOrder(order)}
                      className="text-xs bg-[#242424] hover:bg-[#303030] text-[#FAFAFA] px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Eye size={13} />
                      <span>Batafsil</span>
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

                    {(order.status === 'pending' || order.status === 'cooking') && (
                      <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={() => setCancelOrderId(order.id)}
                        title="Bekor qilish"
                        className="text-xs text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                      >
                        <Ban size={14} />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      <Dialog.Root open={!!selectedOrder} onOpenChange={open => !open && setSelectedOrder(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in" />
          <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 z-50 max-h-[90vh] overflow-y-auto shadow-2xl">
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
                    <p className="text-[10px] text-[#A1A1AA]">+{selectedOrder.tip_percentage ?? 0}% xizmat haqi: {formatPrice(selectedOrder.tip_amount || 0)}</p>
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

      <ConfirmModal
        open={Boolean(cancelOrderId)}
        onClose={() => setCancelOrderId(null)}
        onConfirm={async () => {
          if (!cancelOrderId) return;
          await updateStatus(cancelOrderId, 'cancelled');
          setCancelOrderId(null);
        }}
        loading={Boolean(cancelOrderId && updatingId === cancelOrderId)}
        title="Buyurtmani bekor qilasizmi?"
        description="Ushbu buyurtma bekor qilingan holatga o'tkaziladi."
        confirmText="Ha, bekor qilish"
        loadingText="Bekor qilinmoqda..."
      />
    </div>
  );
};

export default OrdersPage;
