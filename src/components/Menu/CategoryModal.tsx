import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Trash2, X } from 'lucide-react';
import { Category } from '../../lib/types';
import Button from '../UI/Button';
import ConfirmModal from '../UI/ConfirmModal';
import { categoryService } from '../../lib/categoryService';
import { useToast } from '../../lib/toast';

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  orgId: string;
  onRefetch: () => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  open,
  onClose,
  categories,
  onRefetch,
}) => {
  const { success, error: toastError } = useToast();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🍽️');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const addCategory = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      toastError('Kategoriya nomini to\'g\'ri kiriting (kamida 2 ta belgi)');
      return;
    }

    setSaving(true);
    try {
      const response = await categoryService.createCategory({
        name: trimmedName,
        icon: icon.trim() || '🍽️',
        sort_order: categories.length + 1,
      });

      if (response.success) {
        success('Kategoriya qo\'shildi');
        setName('');
        setIcon('🍽️');
        onRefetch();
      } else {
        toastError('Kategoriya qo\'shilmadi');
      }
    } catch {
      toastError('Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await categoryService.deleteCategory(deleteTarget.id);
      if (res.success) {
        success('Kategoriya o\'chirildi');
        setDeleteTarget(null);
        onRefetch();
      }
    } catch {
      toastError('Kategoriyani o\'chirib bo\'lmadi');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#161616] border border-[#2A2A2A] rounded-xl p-6 z-50 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-base font-bold text-[#FAFAFA]">Kategoriyalarni Boshqarish</Dialog.Title>
            <Dialog.Close className="text-[#A1A1AA] hover:text-[#FAFAFA] p-1.5 rounded-lg hover:bg-[#2A2A2A]"><X size={18} /></Dialog.Close>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={icon}
              onChange={e => setIcon(e.target.value)}
              placeholder="🍽️"
              className="w-12 text-center bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl px-2 py-2 text-base focus:outline-none focus:border-[#F59E0B]"
              maxLength={4}
            />
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Yangi kategoriya nomi..."
              className="flex-1 bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl px-3 py-2 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
            />
            <Button onClick={addCategory} variant="primary" disabled={saving}>
              {saving ? '...' : 'Qo\'shish'}
            </Button>
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between py-2 px-3 bg-[#1F1F1F] rounded-xl border border-[#2A2A2A]">
                <span className="text-sm font-medium text-[#FAFAFA] flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </span>
                <button
                  onClick={() => setDeleteTarget({ id: cat.id, name: cat.name })}
                  className="text-[#71717A] hover:text-rose-400 p-1 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteCategory}
        loading={deleting}
        description={
          deleteTarget && (
            <>
              <span className="text-[#FAFAFA] font-semibold">"{deleteTarget.name}"</span> kategoriyasi o'chiriladi.
            </>
          )
        }
      />
    </Dialog.Root>
  );
};
