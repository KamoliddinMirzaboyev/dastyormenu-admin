import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useMenu } from '../../hooks/useMenu';
import { useToast } from '../../lib/toast';
import { Menu } from '../../lib/types';
import { useAuthStore } from '../../store/authStore';
import { GridSkeleton } from '../../components/UI/LoadingSkeleton';
import Button from '../../components/UI/Button';
import { menuService } from '../../lib/menuService';
import { CategoryModal } from '../../components/Menu/CategoryModal';
import { MenuFormModal } from '../../components/Menu/MenuFormModal';
import { MenuCard } from '../../components/Menu/MenuCard';

const MenuPage: React.FC = () => {
  const { organization } = useAuthStore();
  const orgId = organization?.id ?? '';
  const { menus, categories, loading, refetch, deleteMenu, toggleAvailability } = useMenu();
  const { success, error: toastError } = useToast();

  const [activeCat, setActiveCat] = useState<string>('all');
  const [showCatModal, setShowCatModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Menu | null>(null);

  const filtered = activeCat === 'all'
    ? menus
    : menus.filter(m => m.category_id === activeCat);

  const stopListCount = menus.filter(m => !m.is_available).length;

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" taomini o'chirishni xohlaysizmi?`)) return;
    const err = await deleteMenu(id);
    if (err) toastError(err);
    else success('Taom o\'chirildi');
  };

  const handleToggle = async (id: string, current: boolean) => {
    const err = await toggleAvailability(id, current);
    if (err) toastError(err);
    else success(current ? 'Stop-listga qo\'shildi' : 'Sotuvga qaytarildi');
  };

  const handleOpenCreate = () => {
    setEditItem(null);
    setShowForm(true);
  };

  const handleOpenEdit = (menu: Menu) => {
    setEditItem(menu);
    setShowForm(true);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#FAFAFA] flex items-center gap-2">
            <span>Menyu va Taomlar Boshqaruvi</span>
            <span className="text-xs bg-[#242424] text-[#A1A1AA] px-2.5 py-0.5 rounded-full font-normal">
              {menus.length} ta taom
            </span>
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Sotilish narxlari, tan narxlar, marja va tavsiflar
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {stopListCount > 0 && (
            <span className="text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-xl font-medium animate-pulse">
              Stop-list: {stopListCount} ta
            </span>
          )}
          <Button icon={Plus} onClick={handleOpenCreate} variant="primary">
            Yangi taom qo'shish
          </Button>
          <Button variant="secondary" onClick={() => setShowCatModal(true)}>
            Kategoriyalar
          </Button>
        </div>
      </div>

      {/* Category tabs */}
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
          Barchasi ({menus.length})
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

      {/* Grid */}
      {loading ? (
        <GridSkeleton count={8} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#A1A1AA] bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl animate-fade-in">
          <p className="text-4xl mb-2">🍽️</p>
          <p className="text-sm font-semibold text-[#FAFAFA]">Taomlar topilmadi</p>
          <p className="text-xs text-[#71717A] mt-1">Ushbu kategoriyada taomlar mavjud emas</p>
          <div className="mt-4">
            <Button icon={Plus} onClick={handleOpenCreate} variant="secondary" size="sm">
              Ushbu kategoriyaga taom qo'shish
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

      {/* Menu Form Modal */}
      <MenuFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        editItem={editItem}
        categories={categories}
        orgId={orgId}
        onRefetch={refetch}
        uploadImage={async file => {
          const res = await menuService.createMenu({
            name: '',
            category: '',
            price: 0,
            cook_time_minutes: 0,
            image: file,
          });
          return res.data?.image_url ?? null;
        }}
      />
    </div>
  );
};

export default MenuPage;
