import React, { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, Trash2, X, Utensils, CheckCircle, Clock } from 'lucide-react';
import { Table, UserProfile, Menu, Order } from '../../lib/types';
import { useToast } from '../../lib/toast';
import Button from '../../components/UI/Button';
import { tableService } from '../../lib/tableService';
import { staffService } from '../../lib/staffService';
import { menuService } from '../../lib/menuService';
import { orderService } from '../../lib/orderService';
import { NewOrderModal } from '../../components/Orders/NewOrderModal';

const TablesPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [tables, setTables] = useState<Table[]>([]);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [menu, setMenu] = useState<Menu[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Table Modal
  const [addCount, setAddCount] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);

  // New Order Modal for Waiter
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tablesResponse, staffResponse, menuResponse, ordersResponse] = await Promise.all([
        tableService.getTables(),
        staffService.getStaff(),
        menuService.getMenus(),
        orderService.getOrders(),
      ]);

      if (tablesResponse.success && staffResponse.success) {
        const tablesData = tablesResponse.data || [];
        const staffData = staffResponse.data || [];
        const ordersData = ordersResponse.data || [];

        // Attach waiter info
        const tablesWithWaiter = tablesData.map(t => ({
          ...t,
          assigned_waiter: staffData.find(u => u.id === t.assigned_waiter_id),
        }));

        setTables(tablesWithWaiter);
        setStaff(staffData);
        if (menuResponse.success && menuResponse.data) setMenu(menuResponse.data);
        setActiveOrders(ordersData.filter(o => ['pending', 'cooking', 'ready'].includes(o.status)));
      } else {
        toastError('Ma\'lumotlar yuklanmadi');
      }
    } catch (error) {
      toastError('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addTables = async () => {
    if (addCount < 1) return;
    setAdding(true);
    
    try {
      const res = await tableService.createTablesBulk(addCount);
      if (res.success) {
        success(`${addCount} ta stol muvaffaqiyatli qo'shildi`);
        fetchData();
        setShowAddModal(false);
      } else {
        toastError('Stollar qo\'shilmadi');
      }
    } catch (e) {
      toastError('Xatolik yuz berdi');
    } finally {
      setAdding(false);
    }
  };

  const deleteTable = async (id: string, num: number) => {
    if (!confirm(`${num}-stolni o'chirishni xohlaysizmi?`)) return;
    try {
      const res = await tableService.deleteTable(id);
      if (res.success) {
        success('Stol o\'chirildi');
        setTables(prev => prev.filter(t => t.id !== id));
      }
    } catch (e) {
      toastError('Stolni o\'chirib bo\'lmadi');
    }
  };

  const assignWaiter = async (tableId: string, waiterId: string) => {
    try {
      const res = await tableService.assignWaiter(tableId, waiterId || null);
      if (res.success) {
        success('Ofitsiant biriktirildi');
        fetchData();
      }
    } catch (e) {
      toastError('Ofitsiantni biriktirib bo\'lmadi');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#FAFAFA] flex items-center gap-2">
            <span>Stollar Boshqaruvi</span>
            <span className="text-xs bg-[#242424] text-[#A1A1AA] px-2.5 py-0.5 rounded-full font-normal">
              {tables.length} ta stol
            </span>
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Ofitsiantlar orqali buyurtma qabul qilish va stollarni boshqarish
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowAddModal(true)}
            variant="primary"
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Stol qo'shish</span>
          </Button>
        </div>
      </div>

      {/* Info notice: Waiter direct order & table status legend */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle size={17} />
          </div>
          <div>
            <span className="font-semibold text-[#FAFAFA]">Ofitsiant xizmati:</span>{' '}
            <span className="text-[#A1A1AA]">
              Ofitsiant istalgan stoldagi mijozdan buyurtmani to'g'ridan-to'g'ri "Buyurtma Olish" tugmasi orqali qabul qiladi.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[#A1A1AA] shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>Bo'sh stol</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
            <span>Band stol</span>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 h-44 animate-pulse" />
          ))}
        </div>
      ) : tables.length === 0 ? (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-12 text-center text-[#A1A1AA]">
          <p className="font-semibold text-[#FAFAFA] mb-1">Stollar mavjud emas</p>
          <p className="text-xs">Yangi stollar qo'shish uchun yuqoridagi tugmani bosing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.map(table => {
            const activeOrder = activeOrders.find(o => o.table_id === table.id);
            const isOccupied = !!activeOrder;
            const zoneName = table.table_number >= 7 && table.table_number <= 9 
              ? 'VIP Kabina' 
              : table.table_number >= 10 
              ? 'Yozgi Terassa' 
              : 'Asosiy Zal';

            return (
              <div
                key={table.id}
                className={`bg-[#1A1A1A] border rounded-xl p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 ${
                  isOccupied
                    ? 'border-[#F59E0B]/50 shadow-md shadow-[#F59E0B]/10'
                    : 'border-[#2A2A2A] hover:border-[#3A3A3A]'
                }`}
              >
                {/* Table Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-10 h-10 rounded-xl bg-[#242424] border border-[#3A3A3A] text-[#FAFAFA] font-bold text-base flex items-center justify-center">
                      {table.table_number}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        isOccupied
                          ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isOccupied ? (
                        <>
                          <Clock size={11} />
                          <span>Band</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={11} />
                          <span>Bo'sh</span>
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-[#FAFAFA]">{table.table_number}-stol</p>
                  <p className="text-[11px] text-[#A1A1AA]">{zoneName}</p>

                  {/* Waiter assignment */}
                  <div className="mt-3">
                    <label className="block text-[10px] text-[#71717A] mb-1 font-semibold">Ofitsiant:</label>
                    <select
                      value={table.assigned_waiter_id || ''}
                      onChange={e => assignWaiter(table.id, e.target.value)}
                      className="w-full bg-[#121212] border border-[#2E2E2E] rounded-lg px-2 py-1 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
                    >
                      <option value="">Biriktirilmagan</option>
                      {staff.map(s => (
                        <option key={s.id} value={s.id}>{s.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-[#2A2A2A] flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTableForOrder(table.id)}
                    className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Utensils size={13} />
                    <span>Buyurtma Olish</span>
                  </button>

                  <button
                    onClick={() => deleteTable(table.id, table.table_number)}
                    title="O'chirish"
                    className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors active:scale-95"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Tables Modal */}
      <Dialog.Root open={showAddModal} onOpenChange={setShowAddModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 z-50 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-base font-bold text-[#FAFAFA]">
                Yangi Stol Qo'shish
              </Dialog.Title>
              <Dialog.Close className="text-[#A1A1AA] hover:text-[#FAFAFA]">
                <X size={18} />
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                  Nechta stol qo'shilsin?
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={addCount}
                  onChange={e => setAddCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#121212] border border-[#2E2E2E] rounded-xl px-3 py-2 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                  Bekor qilish
                </Button>
                <Button variant="primary" onClick={addTables} disabled={adding}>
                  {adding ? 'Qo\'shilmoqda...' : 'Qo\'shish'}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* New Order Modal (Waiter Take Order) */}
      {selectedTableForOrder && (
        <NewOrderModal
          open={!!selectedTableForOrder}
          onClose={() => setSelectedTableForOrder(null)}
          tables={tables}
          staff={staff}
          menu={menu}
          initialTableId={selectedTableForOrder}
          onOrderCreated={fetchData}
        />
      )}
    </div>
  );
};

export default TablesPage;
