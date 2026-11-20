import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, DollarSign, Plus } from 'lucide-react';
import { ExpenseCategory, toTiyin } from '../../lib/types';
import { expenseService } from '../../lib/expenseService';
import { useToast } from '../../lib/toast';

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onExpenseAdded?: () => void;
}

const CATEGORIES: { key: ExpenseCategory; label: string }[] = [
  { key: 'ingredients', label: 'Masalliqlar & Oziq-ovqat' },
  { key: 'salary',      label: 'Xodimlar maoshi' },
  { key: 'utilities',   label: 'Kommunal to\'lovlar' },
  { key: 'rent',        label: 'Bino ijarasi' },
  { key: 'household',   label: 'Xo\'jalik xarajatlari' },
  { key: 'other',       label: 'Boshqa xarajatlar' },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  open,
  onClose,
  onExpenseAdded,
}) => {
  const { success, error: toastError } = useToast();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('ingredients');
  const [amountSom, setAmountSom] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amountSom.replace(/\s+/g, ''));

    if (!title.trim()) {
      toastError('Xarajat nomini kiriting');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      toastError('To\'g\'ri summani kiriting');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await expenseService.createExpense({
        category,
        title: title.trim(),
        amount: toTiyin(numAmount),
        date,
        note: note.trim() || undefined,
      });

      if (res.success) {
        success('Xarajat muvaffaqiyatli saqlandi');
        setTitle('');
        setAmountSom('');
        setNote('');
        onExpenseAdded?.();
        onClose();
      } else {
        toastError('Xarajat saqlanmadi');
      }
    } catch {
      toastError('Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={val => !val && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#161616] border border-[#2A2A2A] rounded-xl shadow-2xl z-50 p-6 overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-[#2A2A2A] mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <DollarSign size={18} />
              </div>
              <Dialog.Title className="text-base font-bold text-[#FAFAFA]">
                Yangi Xarajat Qo'shish
              </Dialog.Title>
            </div>
            <Dialog.Close className="text-[#A1A1AA] hover:text-[#FAFAFA] p-1.5 rounded-lg hover:bg-[#2A2A2A]">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                Xarajat nomi <span className="text-[#F59E0B]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Masalan: Go'sht mahsulotlari (25 kg)..."
                className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl px-3 py-2 text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#F59E0B]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                  Xarajat toifasi
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl px-3 py-2 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                  Sana
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                Summa (so'mda) <span className="text-[#F59E0B]">*</span>
              </label>
              <input
                type="number"
                value={amountSom}
                onChange={e => setAmountSom(e.target.value)}
                placeholder="Masalan: 450000"
                className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl px-3 py-2 text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#F59E0B]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                Qo'shimcha izoh
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                placeholder="Chek raqami yoki yetkazib beruvchi haqida..."
                className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#F59E0B]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#F59E0B]/20"
              >
                {isSubmitting ? (
                  <span>Saqlanmoqda...</span>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Xarajatni Saqlash</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
