import React, { useState, useRef, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { menuSchema, type MenuFormData } from '../../lib/validators';
import { Upload, X, ImageIcon, Link as LinkIcon, Sparkles } from 'lucide-react';
import { Menu, Category } from '../../lib/types';
import Button from '../UI/Button';
import { menuService } from '../../lib/menuService';
import { useToast } from '../../lib/toast';

const FOOD_PRESETS = [
  { label: 'Osh (Palov)', url: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=600&auto=format&fit=crop&q=80' },
  { label: 'Shashlik', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80' },
  { label: 'Lag\'mon', url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80' },
  { label: 'Qozon Kabob', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80' },
  { label: 'Manti', url: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600&auto=format&fit=crop&q=80' },
  { label: 'Sho\'rva', url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80' },
  { label: 'Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80' },
  { label: 'Salat', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80' },
  { label: 'Choy', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80' },
  { label: 'Limonad', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80' },
  { label: 'Tort', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80' },
  { label: 'Non', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80' },
];

interface MenuFormModalProps {
  open: boolean;
  onClose: () => void;
  editItem?: Menu | null;
  categories: Category[];
  orgId: string;
  onRefetch: () => void;
  uploadImage: (file: File) => Promise<string | null>;
}

export const MenuFormModal: React.FC<MenuFormModalProps> = ({
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

  const { register, handleSubmit, control, reset, watch, formState: { errors, isSubmitting } } = useForm<MenuFormData>({
    resolver: zodResolver(menuSchema),
    defaultValues: editItem ? {
      name: editItem.name,
      category_id: editItem.category_id,
      price_som: editItem.price / 100,
      cost_price_som: editItem.cost_price ? editItem.cost_price / 100 : Math.round(editItem.price * 0.5) / 100,
      description: editItem.description ?? '',
      ingredients: editItem.ingredients ?? '',
      cook_time_minutes: editItem.cook_time_minutes,
      is_available: editItem.is_available,
      sort_order: editItem.sort_order ?? 0,
    } : {
      cook_time_minutes: 15,
      is_available: true,
      sort_order: 0,
      price_som: undefined as any,
      cost_price_som: undefined as any,
    },
  });

  const watchedPrice = watch('price_som');
  const watchedCost = watch('cost_price_som');

  useEffect(() => {
    if (open) {
      if (editItem) {
        setImageUrl(editItem.image_url);
        reset({
          name: editItem.name,
          category_id: editItem.category_id,
          price_som: editItem.price / 100,
          cost_price_som: editItem.cost_price ? editItem.cost_price / 100 : Math.round(editItem.price * 0.5) / 100,
          description: editItem.description ?? '',
          ingredients: editItem.ingredients ?? '',
          cook_time_minutes: editItem.cook_time_minutes,
          is_available: editItem.is_available,
          sort_order: editItem.sort_order ?? 0,
        });
      } else {
        setImageUrl(null);
        reset({
          name: '',
          category_id: categories[0]?.id || '',
          price_som: undefined as any,
          cost_price_som: undefined as any,
          description: '',
          ingredients: '',
          cook_time_minutes: 15,
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
    } catch (error) {
      toastError('Rasm yuklashda xatolik');
    } finally {
      setUploading(false);
    }
  };

  const handleApplyPreset = (url: string) => {
    setImageUrl(url);
    success('Rasm tanlandi');
  };

  const handleApplyCustomUrl = () => {
    if (customUrlInput.trim()) {
      setImageUrl(customUrlInput.trim());
      setCustomUrlInput('');
      setShowUrlInput(false);
      success('Rasm URL qo\'shildi');
    }
  };

  const onSubmit = async (data: MenuFormData) => {
    const costPriceTiyin = data.cost_price_som !== undefined && !isNaN(data.cost_price_som)
      ? Math.round(data.cost_price_som * 100)
      : Math.round(data.price_som * 50);

    const sellingPriceTiyin = Math.round(data.price_som * 100);
    const finalImage = imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';

    try {
      if (editItem) {
        const res = await menuService.updateMenu(editItem.id, {
          category: data.category_id,
          name: data.name.trim(),
          description: data.description?.trim() || '',
          price: sellingPriceTiyin,
          cost_price: costPriceTiyin,
          cook_time_minutes: data.cook_time_minutes,
          ingredients: data.ingredients?.trim() || '',
          is_available: data.is_available,
          sort_order: data.sort_order,
          image: finalImage,
        });

        if (res.success) {
          success('Taom muvaffaqiyatli yangilandi');
          onRefetch();
          onClose();
        } else {
          toastError('Taom yangilanmadi');
        }
      } else {
        const res = await menuService.createMenu({
          category: data.category_id,
          name: data.name.trim(),
          description: data.description?.trim() || '',
          price: sellingPriceTiyin,
          cost_price: costPriceTiyin,
          cook_time_minutes: data.cook_time_minutes,
          ingredients: data.ingredients?.trim() || '',
          is_available: data.is_available,
          sort_order: data.sort_order ?? 0,
          image: finalImage,
        });

        if (res.success) {
          success('Taom muvaffaqiyatli qo\'shildi');
          onRefetch();
          onClose();
        } else {
          toastError('Taom qo\'shilmadi');
        }
      }
    } catch (e) {
      toastError('Xatolik yuz berdi');
    }
  };

  const priceSom = watchedPrice || 0;
  const costSom = watchedCost || 0;
  const marginSom = priceSom - costSom;
  const marginPercent = priceSom > 0 ? Math.round((marginSom / priceSom) * 100) : 0;

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-[#161616] border border-[#2A2A2A] rounded-xl p-6 z-50 max-h-[92vh] overflow-y-auto shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-base font-bold text-[#FAFAFA]">
              {editItem ? 'Taom Ma\'lumotlarini Tahrirlash' : 'Yangi Taom Qo\'shish'}
            </Dialog.Title>
            <Dialog.Close className="text-[#A1A1AA] hover:text-[#FAFAFA] p-1.5 rounded-lg hover:bg-[#2A2A2A]"><X size={18} /></Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Image Preview & Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-[#A1A1AA]">
                  Taom rasmi
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(v => !v)}
                    className="text-[11px] text-[#F59E0B] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <LinkIcon size={12} />
                    <span>URL orqali</span>
                  </button>
                </div>
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
                    className="bg-[#F59E0B] text-black font-bold text-xs px-3 py-1.5 rounded-lg"
                  >
                    Qo'llash
                  </button>
                </div>
              )}

              <div
                onClick={() => fileRef.current?.click()}
                className="relative h-44 bg-[#121212] border-2 border-dashed border-[#2E2E2E] rounded-xl overflow-hidden cursor-pointer hover:border-[#F59E0B]/50 transition-colors flex items-center justify-center group"
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
                        <Upload size={28} className="text-white mx-auto mb-1" />
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
                        <ImageIcon size={36} className="text-[#3A3A3A] mx-auto mb-2" />
                        <p className="text-xs font-semibold text-[#FAFAFA]">Kompyuterdan rasm yuklash</p>
                        <p className="text-[11px] text-[#71717A] mt-0.5">yoki quyidagi tayyor rasmlardan birini tanlang</p>
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

              {/* Fast Preset Images */}
              <div className="mt-2.5">
                <p className="text-[11px] text-[#71717A] mb-1.5 flex items-center gap-1 font-semibold">
                  <Sparkles size={11} className="text-[#F59E0B]" />
                  <span>Tezkor tayyor rasmlar:</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {FOOD_PRESETS.map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleApplyPreset(p.url)}
                      className="text-[11px] bg-[#1E1E1E] hover:bg-[#2A2A2A] text-[#FAFAFA] border border-[#2E2E2E] px-2.5 py-1 rounded-lg transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                Taom nomi <span className="text-[#F59E0B]">*</span>
              </label>
              <input
                {...register('name')}
                placeholder="Masalan: To'y Oshi, Qozon Kabob..."
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

            {/* Dual Price: Sotilish Narxi & Tan Narxi */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                  Sotilish narxi (so'm) <span className="text-[#F59E0B]">*</span>
                </label>
                <input
                  {...register('price_som', { valueAsNumber: true })}
                  type="number"
                  min="100"
                  step="1000"
                  placeholder="45000"
                  className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl px-3 py-2 text-sm text-[#FAFAFA] font-bold focus:outline-none focus:border-[#F59E0B]"
                />
                {errors.price_som && <p className="text-rose-400 text-xs mt-1">{errors.price_som.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                  Tan narxi (so'm) <span className="text-amber-400">*</span>
                </label>
                <input
                  {...register('cost_price_som', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="22000"
                  className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl px-3 py-2 text-sm text-[#FAFAFA] font-bold focus:outline-none focus:border-[#F59E0B]"
                />
                {errors.cost_price_som && <p className="text-rose-400 text-xs mt-1">{errors.cost_price_som.message}</p>}
              </div>
            </div>

            {/* Live Profitability Box */}
            {priceSom > 0 && (
              <div className="bg-[#121212] border border-[#2E2E2E] rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#A1A1AA]">Taomdan sof ustama foyda:</span>
                  <span className="ml-2 font-bold text-emerald-400">
                    +{marginSom.toLocaleString('uz-UZ')} so'm
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  {marginPercent}% marja
                </span>
              </div>
            )}

            {/* Cook Time & Available */}
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                  Pishirish vaqti (daqiqa)
                </label>
                <input
                  {...register('cook_time_minutes', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  max="300"
                  placeholder="15"
                  className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl px-3 py-2 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div className="flex items-center justify-between bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl px-3.5 py-2">
                <span className="text-xs font-semibold text-[#FAFAFA]">Sotuvda mavjud</span>
                <Controller
                  control={control}
                  name="is_available"
                  render={({ field }) => (
                    <Switch.Root
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="w-10 h-5 bg-[#2A2A2A] rounded-full relative data-[state=checked]:bg-[#F59E0B] transition-colors"
                    >
                      <Switch.Thumb className="block w-4 h-4 bg-white rounded-full shadow translate-x-0.5 transition-transform data-[state=checked]:translate-x-5" />
                    </Switch.Root>
                  )}
                />
              </div>
            </div>

            {/* Description & Ingredients */}
            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">Tavsif</label>
              <textarea
                {...register('description')}
                rows={2}
                placeholder="Taom haqida qisqacha ma'lumot..."
                className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B] resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">Tarkibi</label>
              <textarea
                {...register('ingredients')}
                rows={2}
                placeholder="Devzira guruch, lahm qo'y go'shti, sabzi, ziravorlar..."
                className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B] resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>Bekor qilish</Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
