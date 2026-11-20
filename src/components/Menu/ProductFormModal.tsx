import React, { useState, useRef, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, type ProductFormData } from '../../lib/validators';
import { Upload, X, ImageIcon, Link as LinkIcon, Package } from 'lucide-react';
import { Menu, Category, ProductUnit } from '../../lib/types';
import Button from '../UI/Button';
import { menuService } from '../../lib/menuService';
import { useToast } from '../../lib/toast';

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  editItem?: Menu | null;
  categories: Category[];
  orgId: string;
  onRefetch: () => void;
  uploadImage: (file: File) => Promise<string | null>;
}

const UNIT_OPTIONS: { key: ProductUnit; label: string; icon: string }[] = [
  { key: 'dona',    label: 'Dona',     icon: '📦' },
  { key: 'litr',    label: 'Litr (L)', icon: '🥤' },
  { key: 'ml',      label: 'Millilitr',icon: '💧' },
  { key: 'gram',    label: 'Gram (g)', icon: '⚖️' },
  { key: 'kg',      label: 'Kilogram', icon: '⚖️' },
  { key: 'choynak', label: 'Choynak',  icon: '🫖' },
  { key: 'butilka', label: 'Butilka',  icon: '🍾' },
  { key: 'porsiya', label: 'Porsiya',  icon: '🍽️' },
];

const QUICK_VOLUME_PRESETS = [
  { label: '0.5 L',     amount: 0.5, unit: 'litr' as ProductUnit },
  { label: '1 L',       amount: 1,   unit: 'litr' as ProductUnit },
  { label: '1.5 L',     amount: 1.5, unit: 'litr' as ProductUnit },
  { label: '1 dona',    amount: 1,   unit: 'dona' as ProductUnit },
  { label: '1 choynak', amount: 1,   unit: 'choynak' as ProductUnit },
  { label: '250 g',     amount: 250, unit: 'gram' as ProductUnit },
  { label: '500 ml',    amount: 500, unit: 'ml' as ProductUnit },
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  open,
  onClose,
  editItem,
  categories,
  onRefetch,
  uploadImage,
}) => {
  const { success, error: toastError } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(editItem?.image_url ?? null);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Default category helper: pick drinks or non if exists, otherwise first category
  const defaultCategory = () => {
    const match = categories.find(c => 
      c.name.toLowerCase().includes('ichimlik') || 
      c.name.toLowerCase().includes('bar') || 
      c.name.toLowerCase().includes('non')
    );
    return match?.id || categories[0]?.id || '';
  };

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: editItem ? {
      name: editItem.name,
      category_id: editItem.category_id,
      unit: editItem.unit || 'dona',
      unit_amount: editItem.unit_amount || 1,
      price_som: editItem.price / 100,
      cost_price_som: editItem.cost_price ? editItem.cost_price / 100 : Math.round(editItem.price * 0.6) / 100,
      description: editItem.description ?? '',
      is_available: editItem.is_available,
      sort_order: editItem.sort_order ?? 0,
    } : {
      name: '',
      category_id: defaultCategory(),
      unit: 'litr',
      unit_amount: 1,
      price_som: undefined as any,
      cost_price_som: undefined as any,
      description: '',
      is_available: true,
      sort_order: 0,
    },
  });

  const watchedPrice = watch('price_som');
  const watchedCost = watch('cost_price_som');
  const watchedUnit = watch('unit');
  const watchedUnitAmount = watch('unit_amount');

  useEffect(() => {
    if (open) {
      if (editItem) {
        setImageUrl(editItem.image_url);
        reset({
          name: editItem.name,
          category_id: editItem.category_id,
          unit: editItem.unit || 'dona',
          unit_amount: editItem.unit_amount || 1,
          price_som: editItem.price / 100,
          cost_price_som: editItem.cost_price ? editItem.cost_price / 100 : Math.round(editItem.price * 0.6) / 100,
          description: editItem.description ?? '',
          is_available: editItem.is_available,
          sort_order: editItem.sort_order ?? 0,
        });
      } else {
        setImageUrl(null);
        reset({
          name: '',
          category_id: defaultCategory(),
          unit: 'litr',
          unit_amount: 1,
          price_som: undefined as any,
          cost_price_som: undefined as any,
          description: '',
          is_available: true,
          sort_order: 0,
        });
      }
    }
  }, [editItem, open, reset, categories]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        setImageUrl(url);
      } else {
        toastError('Rasm yuklanmadi');
      }
    } catch {
      toastError('Rasm yuklashda xatolik yuz berdi');
    } finally {
      setUploading(false);
    }
  };

  const handleApplyCustomUrl = () => {
    if (customUrlInput.trim()) {
      setImageUrl(customUrlInput.trim());
      setCustomUrlInput('');
      setShowUrlInput(false);
      success('Rasm URL qo\'shildi');
    }
  };

  const handleApplyPreset = (amount: number, unit: ProductUnit) => {
    setValue('unit', unit);
    setValue('unit_amount', amount);
  };

  const onSubmit = async (data: ProductFormData) => {
    const costPriceTiyin = data.cost_price_som !== undefined && !isNaN(data.cost_price_som)
      ? Math.round(data.cost_price_som * 100)
      : Math.round(data.price_som * 60);

    const sellingPriceTiyin = Math.round(data.price_som * 100);
    const finalImage = imageUrl || 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80';

    try {
      if (editItem) {
        const res = await menuService.updateMenu(editItem.id, {
          category: data.category_id,
          name: data.name.trim(),
          item_type: 'product',
          unit: data.unit,
          unit_amount: data.unit_amount,
          description: data.description?.trim() || '',
          price: sellingPriceTiyin,
          cost_price: costPriceTiyin,
          cook_time_minutes: 0, // ready-made products do not need cooking time
          is_available: data.is_available,
          sort_order: data.sort_order,
          image: finalImage,
        });

        if (res.success) {
          success('Mahsulot muvaffaqiyatli yangilandi');
          onRefetch();
          onClose();
        } else {
          toastError('Mahsulot yangilanmadi');
        }
      } else {
        const res = await menuService.createMenu({
          category: data.category_id,
          name: data.name.trim(),
          item_type: 'product',
          unit: data.unit,
          unit_amount: data.unit_amount,
          description: data.description?.trim() || '',
          price: sellingPriceTiyin,
          cost_price: costPriceTiyin,
          cook_time_minutes: 0, // ready-made products do not need cooking time
          is_available: data.is_available,
          sort_order: data.sort_order ?? 0,
          image: finalImage,
        });

        if (res.success) {
          success('Mahsulot muvaffaqiyatli qo\'shildi');
          onRefetch();
          onClose();
        } else {
          toastError('Mahsulot qo\'shilmadi');
        }
      }
    } catch {
      toastError('Xatolik yuz berdi');
    }
  };

  const priceSom = watchedPrice || 0;
  const costSom = watchedCost || 0;
  const marginSom = priceSom - costSom;
  const marginPercent = priceSom > 0 ? Math.round((marginSom / priceSom) * 100) : 0;

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 z-50 max-h-[92vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#262626] mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#242424] border border-[#333333] flex items-center justify-center text-[#FAFAFA]">
                <Package size={17} />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-[#FAFAFA]">
                  {editItem ? 'Mahsulotni Tahrirlash' : 'Yangi Mahsulot Qo\'shish'}
                </Dialog.Title>
                <p className="text-xs text-[#71717A]">
                  Tayyor ichimliklar (Cola, Pepsi, suvlar), non, choy va bar mahsulotlari
                </p>
              </div>
            </div>
            <Dialog.Close className="text-[#A1A1AA] hover:text-[#FAFAFA] p-1.5 rounded-lg hover:bg-[#242424] transition-colors">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Image Section */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#A1A1AA]">Mahsulot rasmi</label>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(v => !v)}
                  className="text-xs text-[#F59E0B] hover:underline flex items-center gap-1 font-semibold"
                >
                  <LinkIcon size={12} />
                  <span>URL orqali</span>
                </button>
              </div>

              {showUrlInput && (
                <div className="flex gap-2 mb-2 p-2 bg-[#1F1F1F] rounded-xl border border-[#2E2E2E]">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={e => setCustomUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 bg-[#121212] border border-[#2A2A2A] rounded-lg px-2.5 py-1.5 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomUrl}
                    className="bg-[#F59E0B] text-black font-bold text-xs px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                  >
                    Qo'llash
                  </button>
                </div>
              )}

              <div
                onClick={() => fileRef.current?.click()}
                className="relative h-40 bg-[#121212] border-2 border-dashed border-[#2E2E2E] rounded-xl overflow-hidden cursor-pointer hover:border-[#F59E0B]/50 transition-colors flex items-center justify-center group"
              >
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center">
                        <Upload size={26} className="text-white mx-auto mb-1" />
                        <p className="text-xs text-white font-medium">Boshqa rasm yuklash</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    {uploading ? (
                      <div className="w-8 h-8 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : (
                      <>
                        <ImageIcon size={34} className="text-[#3A3A3A] mx-auto mb-1.5" />
                        <p className="text-xs font-semibold text-[#FAFAFA]">Kompyuterdan rasm yuklash</p>
                        <p className="text-[11px] text-[#71717A] mt-0.5">PNG, JPG yoki WebP formatida</p>
                      </>
                    )}
                  </div>
                )}

                {imageUrl && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setImageUrl(null);
                    }}
                    className="absolute top-2.5 right-2.5 w-7 h-7 bg-black/70 hover:bg-rose-600 rounded-full flex items-center justify-center text-white transition-colors z-10"
                    title="O'chirish"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                Mahsulot nomi <span className="text-[#F59E0B]">*</span>
              </label>
              <input
                {...register('name')}
                placeholder="Masalan: Coca-Cola 1.5L, Pepsi, Tandir Non, Ko'k Choy..."
                className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl px-3 py-2 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
              />
              {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                Kategoriya <span className="text-[#F59E0B]">*</span>
              </label>
              <select
                {...register('category_id')}
                className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl px-3 py-2 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
              >
                <option value="">Kategoriyani tanlang</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
              {errors.category_id && <p className="text-rose-400 text-xs mt-1">{errors.category_id.message}</p>}
            </div>

            {/* Unit and Amount / Volume Section */}
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#FAFAFA] flex items-center gap-1.5">
                  <Package size={14} className="text-[#F59E0B]" />
                  <span>Miqdori va O'lchov Birligi</span>
                </span>
                <span className="text-[11px] text-[#71717A]">
                  Tanlangan: <strong className="text-[#FAFAFA]">{watchedUnitAmount || '1'} {watchedUnit || 'dona'}</strong>
                </span>
              </div>

              {/* Quick Volume / Quantity Presets */}
              <div>
                <p className="text-[10px] text-[#71717A] mb-1.5 font-semibold uppercase tracking-wider">
                  Tezkor parametrlar:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_VOLUME_PRESETS.map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleApplyPreset(p.amount, p.unit)}
                      className="text-xs bg-[#1E1E1E] hover:bg-[#2A2A2A] hover:border-[#F59E0B]/50 text-[#FAFAFA] border border-[#2E2E2E] px-2.5 py-1 rounded-lg transition-all active:scale-95"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Precise input: Amount + Unit */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] text-[#A1A1AA] mb-1 font-medium">
                    Miqdori (Hajmi / Soni)
                  </label>
                  <input
                    {...register('unit_amount')}
                    placeholder="Masalan: 0.5, 1, 1.5, 250"
                    className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl px-3 py-1.5 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#A1A1AA] mb-1 font-medium">
                    O'lchov birligi
                  </label>
                  <select
                    {...register('unit')}
                    className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl px-3 py-1.5 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
                  >
                    {UNIT_OPTIONS.map(u => (
                      <option key={u.key} value={u.key}>
                        {u.icon} {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Financials: Selling Price & Cost Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                  Sotilish Narxi (so'm) <span className="text-[#F59E0B]">*</span>
                </label>
                <div className="relative">
                  <input
                    {...register('price_som', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    placeholder="Masalan: 18000"
                    className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl pl-3 pr-12 py-2 text-sm text-[#FAFAFA] font-mono focus:outline-none focus:border-[#F59E0B]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#71717A]">so'm</span>
                </div>
                {errors.price_som && <p className="text-rose-400 text-xs mt-1">{errors.price_som.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                  Tan Narxi / Kelish narxi (so'm)
                </label>
                <div className="relative">
                  <input
                    {...register('cost_price_som', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    placeholder="Masalan: 12000"
                    className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl pl-3 pr-12 py-2 text-sm text-[#FAFAFA] font-mono focus:outline-none focus:border-[#F59E0B]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#71717A]">so'm</span>
                </div>
                {errors.cost_price_som && <p className="text-rose-400 text-xs mt-1">{errors.cost_price_som.message}</p>}
              </div>
            </div>

            {/* Profit Margin Indicator */}
            {priceSom > 0 && (
              <div className="p-3 bg-[#141414] rounded-xl border border-[#262626] flex items-center justify-between text-xs">
                <span className="text-[#71717A]">Bitta mahsulotdan sof foyda:</span>
                <span className={`font-mono font-bold ${marginSom >= 0 ? 'text-[#FAFAFA]' : 'text-rose-400'}`}>
                  {marginSom.toLocaleString()} so'm ({marginPercent}%)
                </span>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                Tavsif (ixtiyoriy)
              </label>
              <textarea
                {...register('description')}
                rows={2}
                placeholder="Sovuq holda beriladi, gazlangan tetiklashtiruvchi ichimlik..."
                className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B] resize-none"
              />
              {errors.description && <p className="text-rose-400 text-xs mt-1">{errors.description.message}</p>}
            </div>

            {/* Availability Switch */}
            <div className="flex items-center justify-between p-3 bg-[#1F1F1F] rounded-xl border border-[#2E2E2E]">
              <div>
                <p className="text-xs font-semibold text-[#FAFAFA]">Sotuvda mavjud</p>
                <p className="text-[11px] text-[#71717A]">O'chirilsa, stop-listga o'tadi va ofitsiantlar tanlay olmaydi</p>
              </div>
              <Controller
                name="is_available"
                control={control}
                render={({ field }) => (
                  <Switch.Root
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                      field.value ? 'bg-[#F59E0B]' : 'bg-[#333]'
                    }`}
                  >
                    <Switch.Thumb
                      className={`block w-4 h-4 bg-white rounded-full transition-transform duration-100 ${
                        field.value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </Switch.Root>
                )}
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[#262626] flex items-center justify-end gap-3">
              <Button type="button" variant="secondary" onClick={onClose}>
                Bekor qilish
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saqlanmoqda...' : (editItem ? 'O\'zgarishlarni saqlash' : 'Mahsulotni qo\'shish')}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
