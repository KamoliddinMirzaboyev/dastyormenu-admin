import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description: React.ReactNode;
  confirmText?: string;
  loadingText?: string;
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  title = "Rostdan ham o'chirmoqchimisiz?",
  description,
  confirmText = "Ha, o'chirish",
  loadingText = "O'chirilmoqda...",
  loading = false,
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={v => !v && !loading && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] animate-fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#161616] border border-[#2A2A2A] rounded-xl p-6 z-[60] shadow-2xl"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-base font-bold text-[#FAFAFA]">
                {title}
              </Dialog.Title>
              <p className="text-xs text-[#A1A1AA] mt-1">{description}</p>
            </div>
            <Dialog.Close
              disabled={loading}
              className="text-[#A1A1AA] hover:text-[#FAFAFA] p-1 rounded-lg hover:bg-[#2A2A2A]"
            >
              <X size={16} />
            </Dialog.Close>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Bekor qilish
            </Button>
            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors disabled:opacity-50"
            >
              {loading ? loadingText : confirmText}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ConfirmModal;
