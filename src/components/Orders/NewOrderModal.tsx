import React, { useState, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Search, Plus, Minus, ShoppingBag, Check, Utensils } from 'lucide-react';
import { Menu, Table, UserProfile, formatPrice } from '../../lib/types';
import { orderService } from '../../lib/orderService';
import { useToast } from '../../lib/toast';

interface NewOrderModalProps {
  open: boolean;
  onClose: () => void;
  tables: Table[];
  staff: UserProfile[];
  menu: Menu[];
  initialTableId?: string;
  onOrderCreated?: () => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  open,
  onClose,
  tables,
  staff,
  menu,
  initialTableId,
  onOrderCreated,
}) => {
  const { success, error: toastError } = useToast();

  const [selectedTableId, setSelectedTableId] = useState<string>(
    initialTableId || (tables[0]?.id ?? '')
  );
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerNote, setCustomerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initialTableId when opened
  React.useEffect(() => {
    if (initialTableId) {
      setSelectedTableId(initialTableId);
      const tbl = tables.find(t => t.id === initialTableId);
      if (tbl?.assigned_waiter_id) {
        setSelectedWaiterId(tbl.assigned_waiter_id);
      }
    } else if (tables.length > 0 && !selectedTableId) {
      setSelectedTableId(tables[0].id);
    }
  }, [initialTableId, tables]);

  // Extract unique categories from menu
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    menu.forEach(m => {
      if (m.category_id) {
        const catName = m.category?.name || (m.category_id === 'cat-1' ? 'Milliy taomlar' : m.category_id === 'cat-2' ? 'Kaboblar' : m.category_id === 'cat-3' ? 'Sho\'rvalar' : m.category_id === 'cat-4' ? 'Fast food' : m.category_id === 'cat-5' ? 'Salatlar' : m.category_id === 'cat-6' ? 'Ichimliklar' : 'Boshqa');
        map.set(m.category_id, catName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [menu]);

  // Filtered menu items
  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      const matchCat = selectedCategory === 'all' || item.category_id === selectedCategory;
      const matchSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch && item.is_available;
    });
  }, [menu, selectedCategory, searchQuery]);

  // Waiters list
  const waiters = useMemo(() => {
    return staff.filter(s => s.role === 'waiter' || s.role === 'manager');
  }, [staff]);

  const updateQuantity = (menuId: string, delta: number) => {
    setCart(prev => {
      const current = prev[menuId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[menuId];
        return copy;
      }
      return { ...prev, [menuId]: next };
    });
  };

  // Cart calculations
  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([menuId, qty]) => {
      const item = menu.find(m => m.id === menuId);
      return {
        menu: item!,
        quantity: qty,
        subtotal: (item?.price || 0) * qty,
      };
    }).filter(i => !!i.menu);
  }, [cart, menu]);

  const totalAmount = cartItems.reduce((sum, i) => sum + i.subtotal, 0);
  const tipAmount = Math.round(totalAmount * 0.1); // 10%
  const grandTotal = totalAmount + tipAmount;

  const handleSubmit = async () => {
    if (!selectedTableId) {
      toastError('Iltimos, stolni tanlang');
      return;
    }
    if (cartItems.length === 0) {
      toastError('Iltimos, kamida bitta taom tanlang');
      return;
    }

    setIsSubmitting(true);
    try {
      const items = cartItems.map(i => ({
        menu_id: i.menu.id,
        quantity: i.quantity,
      }));

      const res = await orderService.createOrder({
        table_id: selectedTableId,
        waiter_id: selectedWaiterId || null,
        items,
        customer_note: customerNote.trim() || null,
        status: 'pending',
      });

      if (res.success) {
        const tableObj = tables.find(t => t.id === selectedTableId);
        success(`Buyurtma qabul qilindi! (${tableObj?.table_number}-stol)`);
        setCart({});
        setCustomerNote('');
        onOrderCreated?.();
        onClose();
      } else {
        toastError(res.error?.message || 'Buyurtma yaratilmadi');
      }
    } catch (e) {
      toastError('Buyurtma saqlashda xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={val => !val && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[92vh] bg-[#141414] border border-[#2A2A2A] rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A] bg-[#1A1A1A]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B]">
                <Utensils size={20} />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-[#FAFAFA]">
                  Ofitsiant Buyurtmasi Qabul Qilish
                </Dialog.Title>
                <p className="text-xs text-[#A1A1AA]">
                  Ofitsiant tomonidan stolga tezkor buyurtma ochish
                </p>
              </div>
            </div>
            <Dialog.Close className="text-[#A1A1AA] hover:text-[#FAFAFA] p-1.5 rounded-lg hover:bg-[#2A2A2A] transition-colors">
              <X size={18} />
            </Dialog.Close>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Left Column: Menu Selector (7 cols) */}
            <div className="lg:col-span-7 p-5 flex flex-col border-b lg:border-b-0 lg:border-r border-[#2A2A2A] overflow-hidden">
              {/* Selectors Bar: Table & Waiter */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                    Stolni tanlang <span className="text-[#F59E0B]">*</span>
                  </label>
                  <select
                    value={selectedTableId}
                    onChange={e => setSelectedTableId(e.target.value)}
                    className="w-full bg-[#1E1E1E] border border-[#2E2E2E] rounded-xl px-3 py-2 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
                  >
                    {tables.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.table_number}-stol {t.table_number >= 7 && t.table_number <= 9 ? '(VIP)' : t.table_number >= 10 ? '(Terassa)' : '(Zal)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                    Xizmat ko'rsatuvchi ofitsiant
                  </label>
                  <select
                    value={selectedWaiterId}
                    onChange={e => setSelectedWaiterId(e.target.value)}
                    className="w-full bg-[#1E1E1E] border border-[#2E2E2E] rounded-xl px-3 py-2 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
                  >
                    <option value="">Ofitsiantni tanlang</option>
                    {waiters.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.full_name} ({w.role === 'manager' ? 'Menejer' : 'Ofitsiant'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search & Category Tabs */}
              <div className="space-y-2 mb-3">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Taom yoki ichimlik nomi..."
                    className="w-full bg-[#1E1E1E] border border-[#2E2E2E] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#FAFAFA] placeholder-[#A1A1AA]/50 focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>

                {/* Categories */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-[#F59E0B] text-black font-semibold'
                        : 'bg-[#1E1E1E] text-[#A1A1AA] hover:text-[#FAFAFA]'
                    }`}
                  >
                    Barchasi
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-[#F59E0B] text-black font-semibold'
                          : 'bg-[#1E1E1E] text-[#A1A1AA] hover:text-[#FAFAFA]'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Items Grid */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredMenu.length === 0 ? (
                  <div className="text-center py-10 text-[#A1A1AA] text-xs">
                    Mos taomlar topilmadi
                  </div>
                ) : (
                  filteredMenu.map(item => {
                    const qty = cart[item.id] || 0;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                          qty > 0
                            ? 'bg-[#F59E0B]/5 border-[#F59E0B]/30'
                            : 'bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#3A3A3A]'
                        }`}
                      >
                        <img
                          src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&fit=crop'}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover bg-[#2A2A2A] shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&fit=crop';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-[#FAFAFA] truncate">{item.name}</h4>
                          <p className="text-xs text-[#F59E0B] font-semibold">{formatPrice(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {qty > 0 && (
                            <>
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-7 h-7 rounded-lg bg-[#2A2A2A] hover:bg-[#3A3A3A] text-[#FAFAFA] flex items-center justify-center"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-6 text-center text-xs font-bold text-[#FAFAFA]">
                                {qty}
                              </span>
                            </>
                          )}
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-7 h-7 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold flex items-center justify-center transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Order Cart & Checkout (5 cols) */}
            <div className="lg:col-span-5 p-5 flex flex-col bg-[#161616] overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2A] mb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={17} className="text-[#F59E0B]" />
                  <h3 className="text-sm font-bold text-[#FAFAFA]">Buyurtma tarkibi</h3>
                </div>
                <span className="text-xs bg-[#2A2A2A] px-2 py-0.5 rounded-full text-[#A1A1AA]">
                  {cartItems.reduce((acc, i) => acc + i.quantity, 0)} dona
                </span>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#A1A1AA]">
                    <ShoppingBag size={36} className="text-[#3A3A3A] mb-2" />
                    <p className="text-sm font-medium">Savatcha bo'sh</p>
                    <p className="text-xs text-[#71717A] mt-1">
                      Chap tarafdan taomlarni tanlang
                    </p>
                  </div>
                ) : (
                  cartItems.map(({ menu: item, quantity, subtotal }) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl text-xs"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-medium text-[#FAFAFA] truncate">{item.name}</p>
                        <p className="text-[#A1A1AA]">{formatPrice(item.price)} × {quantity}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold text-[#FAFAFA]">{formatPrice(subtotal)}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-5 h-5 rounded bg-[#2A2A2A] hover:bg-[#3A3A3A] text-[#FAFAFA] flex items-center justify-center"
                          >
                            <Minus size={11} />
                          </button>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-5 h-5 rounded bg-[#2A2A2A] hover:bg-[#3A3A3A] text-[#FAFAFA] flex items-center justify-center"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Customer Note */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1">
                  Mijoz istagi / Izoh
                </label>
                <input
                  type="text"
                  value={customerNote}
                  onChange={e => setCustomerNote(e.target.value)}
                  placeholder="Masalan: kamroq yog'li, piyozsiz, achchiq..."
                  className="w-full bg-[#1E1E1E] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              {/* Total & Summary Box */}
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3.5 space-y-2 mb-4">
                <div className="flex justify-between text-xs text-[#A1A1AA]">
                  <span>Taomlar summasi:</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-[#A1A1AA]">
                  <span>Xizmat haqi (10%):</span>
                  <span>{formatPrice(tipAmount)}</span>
                </div>
                <div className="pt-2 border-t border-[#2A2A2A] flex justify-between text-sm font-bold text-[#FAFAFA]">
                  <span>Jami to'lov:</span>
                  <span className="text-[#F59E0B] text-base">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || cartItems.length === 0}
                className="w-full bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#F59E0B]/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Qabul qilinmoqda...</span>
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    <span>Buyurtmani Qabul Qilish</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
