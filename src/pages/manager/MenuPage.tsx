import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Package, UtensilsCrossed } from 'lucide-react';
import { useMenu } from '../../hooks/useMenu';
import { useToast } from '../../lib/toast';
import { Menu } from '../../lib/types';
import { useAuthStore } from '../../store/authStore';
import { GridSkeleton } from '../../components/UI/LoadingSkeleton';
import Button from '../../components/UI/Button';
import ConfirmModal from '../../components/UI/ConfirmModal';
import { CategoryModal } from '../../components/Menu/CategoryModal';
import { MenuFormModal } from '../../components/Menu/MenuFormModal';
import { ProductFormModal } from '../../components/Menu/ProductFormModal';
import { MenuCard } from '../../components/Menu/MenuCard';
import { resizeImage, fileToBase64 } from '../../lib/imageUploadService';

const MenuPage: React.FC = () => {
  const { organization } = useAuthStore();
  const orgId = organization?.id ?? '';
  const { menus, categories, loading, isFetching, refetch, deleteMenu, toggleAvailability } = useMenu();
  const { success, error: toastError } = useToast();

  const [activeCat, setActiveCat] = useState<string>('all');
  const [activeType, setActiveType] = useState<'all' | 'dish' | 'product'>('all');
  const [showCatModal, setShowCatModal] = useState(false);
  const [showDishModal, setShowDishModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editItem, setEditItem] = useState<Menu | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const dishCount = menus.filter(m => m.item_type !== 'product').length;
  const productCount = menus.filter(m => m.item_type === 'product').length;

  const filtered = menus.filter(m => {
    if (activeCat !== 'all' && m.category_id !== activeCat) return false;
    if (activeType === 'dish' && m.item_type === 'product') return false;
    if (activeType === 'product' && m.item_type !== 'product') return false;
    return true;
  });

  const stopListCount = menus.filter(m => !m.is_available).length;

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const err = await deleteMenu(deleteTarget.id);
      if (err) toastError(err);
      else {
        success('O\'chirildi');
        setDeleteTarget(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    const err = await toggleAvailability(id, current);
    if (err) toastError(err);
    else success(current ? 'Stop-listga qo\'shildi' : 'Sotuvga qaytarildi');
  };

  const handleOpenDishCreate = () => {
    setEditItem(null);
    setShowDishModal(true);
  };

  const handleOpenProductCreate = () => {
    setEditItem(null);
    setShowProductModal(true);
  };

  const handleOpenEdit = (menu: Menu) => {
    setEditItem(menu);
    if (menu.item_type === 'product') {
      setShowProductModal(true);
    } else {
      setShowDishModal(true);
    }
  };

  const handleUploadImage = async (file: File): Promise<string | null> => {
    try {
      const resized = await resizeImage(file, 1000, 1000, 0.85);
      return await fileToBase64(resized);
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#FAFAFA] flex items-center gap-2">
            <span>Menyu va Mahsulotlar Boshqaruvi</span>
            <span className="text-xs bg-[#242424] text-[#A1A1AA] px-2.5 py-0.5 rounded-full font-normal">
              {menus.length} ta umumiy
            </span>
            {isFetching && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-2.5 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-ping" />
                <span>Yangilanmoqda</span>
              </span>
            )}
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Oshxona taomlari, tayyor ichimliklar (Cola, suv), non va bar mahsulotlari
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {stopListCount > 0 && (
            <span className="text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-xl font-medium animate-pulse">
              Stop-list: {stopListCount} ta
            </span>
          )}
          
          {/* 1. Taom qo'shish modal tugmasi */}
          <Button icon={Plus} onClick={handleOpenDishCreate} variant="primary">
            Taom qo'shish
          </Button>

          {/* 2. Mahsulot qo'shish modal tugmasi */}
          <Button icon={Package} onClick={handleOpenProductCreate} variant="secondary">
            Mahsulot qo'shish
          </Button>

          {/* Kategoriyalar */}
          <Button variant="outline" onClick={() => setShowCatModal(true)}>
            Kategoriyalar
          </Button>
        </div>
      </div>

      {/* Main Filter Section: Type Filter + Categories */}
      <div className="space-y-3">
        {/* Type Filter Pills: All / Dishes / Ready Products */}
        <div className="flex items-center gap-2 border-b border-[#242424] pb-2 text-xs">
          <button
            onClick={() => setActiveType('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors flex items-center gap-1.5 ${
              activeType === 'all'
                ? 'bg-[#2E2E2E] text-[#FAFAFA] border border-[#3E3E3E]'
                : 'text-[#71717A] hover:text-[#FAFAFA]'
            }`}
          >
            <span>Barchasi</span>
            <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded-full font-mono">{menus.length}</span>
          </button>

          <button
            onClick={() => setActiveType('dish')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors flex items-center gap-1.5 ${
              activeType === 'dish'
                ? 'bg-[#2E2E2E] text-[#FAFAFA] border border-[#3E3E3E]'
                : 'text-[#71717A] hover:text-[#FAFAFA]'
            }`}
          >
            <UtensilsCrossed size={13} className="text-[#A1A1AA]" />
            <span>Oshxona Taomlari</span>
            <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded-full font-mono">{dishCount}</span>
          </button>

          <button
            onClick={() => setActiveType('product')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors flex items-center gap-1.5 ${
              activeType === 'product'
                ? 'bg-[#2E2E2E] text-[#FAFAFA] border border-[#3E3E3E]'
                : 'text-[#71717A] hover:text-[#FAFAFA]'
            }`}
          >
            <Package size={13} className="text-[#F59E0B]" />
            <span>Tayyor Mahsulotlar / Bar</span>
            <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded-full font-mono">{productCount}</span>
          </button>
        </div>

        {/* Category horizontal scroll tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveCat('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors duration-150 ${
              activeCat === 'all'
                ? 'bg-[#F59E0B] text-black shadow-md shadow-[#F59E0B]/20'
                : 'bg-[#1A1A1A] border border-[#2A2A2A] text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#242424]'
            }`}
          >
            Barcha toifalar
          </motion.button>
          {categories.map(cat => {
            const count = menus.filter(m => m.category_id === cat.id).length;
            return (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCat(cat.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors duration-150 flex items-center gap-1.5 ${
                  activeCat === cat.id
                    ? 'bg-[#F59E0B] text-black shadow-md shadow-[#F59E0B]/20'
                    : 'bg-[#1A1A1A] border border-[#2A2A2A] text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#242424]'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeCat === cat.id ? 'bg-black/20 text-black font-bold' : 'bg-[#252525] text-[#888]'}`}>
                  {count}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {loading && menus.length === 0 ? (
        <GridSkeleton count={8} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#A1A1AA] bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl animate-fade-in">
          <p className="text-4xl mb-2">🍽️</p>
          <p className="text-sm font-semibold text-[#FAFAFA]">Taomlar yoki mahsulotlar topilmadi</p>
          <p className="text-xs text-[#71717A] mt-1">Ushbu parametrlar bo'yicha element mavjud emas</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button icon={Plus} onClick={handleOpenDishCreate} variant="secondary" size="sm">
              Taom qo'shish
            </Button>
            <Button icon={Package} onClick={handleOpenProductCreate} variant="outline" size="sm">
              Mahsulot qo'shish
            </Button>
          </div>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(menu => (
            <MenuCard
              key={menu.id}
              menu={menu}
              onEdit={handleOpenEdit}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </motion.div>
      )}

      {/* Category Modal */}
      <CategoryModal
        open={showCatModal}
        onClose={() => setShowCatModal(false)}
        categories={categories}
        orgId={orgId}
        onRefetch={refetch}
      />

      {/* 1. Taom qo'shish / tahrirlash modali (Hot / Cooked Meals) */}
      <MenuFormModal
        open={showDishModal}
        onClose={() => setShowDishModal(false)}
        editItem={editItem}
        categories={categories}
        orgId={orgId}
        onRefetch={refetch}
        uploadImage={handleUploadImage}
      />

      {/* 2. Mahsulot qo'shish / tahrirlash modali (Ready Products: Cola, Suv, Non, Choy, Bar) */}
      <ProductFormModal
        open={showProductModal}
        onClose={() => setShowProductModal(false)}
        editItem={editItem}
        categories={categories}
        orgId={orgId}
        onRefetch={refetch}
        uploadImage={handleUploadImage}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        description={
          deleteTarget && (
            <>
              <span className="text-[#FAFAFA] font-semibold">"{deleteTarget.name}"</span> menyudan o'chiriladi.
            </>
          )
        }
      />
    </div>
  );
};

export default MenuPage;
