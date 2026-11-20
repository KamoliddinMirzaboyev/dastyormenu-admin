import React from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, ImageIcon, Clock, TrendingUp } from 'lucide-react';
import { Menu, formatPrice, getImageUrl } from '../../lib/types';

interface MenuCardProps {
  menu: Menu;
  onEdit: (menu: Menu) => void;
  onToggle: (id: string, current: boolean) => void;
  onDelete: (id: string, name: string) => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({
  menu,
  onEdit,
  onToggle,
  onDelete,
}) => {
  const costPrice = menu.cost_price || Math.round(menu.price * 0.5);
  const margin = menu.price - costPrice;
  const marginPct = menu.price > 0 ? Math.round((margin / menu.price) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="group bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden hover:border-[#3A3A3A] transition-colors flex flex-col justify-between shadow-sm hover:shadow-md"
    >
      {/* Image Container */}
      <div className="relative h-44 bg-[#121212] overflow-hidden">
        {menu.image_url ? (
          <img
            src={getImageUrl(menu.image_url) || ''}
            alt={menu.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={e => {
              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&fit=crop';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#4A4A4A]">
            <ImageIcon size={32} />
            <span className="text-[11px] mt-1 text-[#666]">Rasm yo'q</span>
          </div>
        )}

        {/* Inactive / Stop-list Overlay */}
        {!menu.is_available && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center animate-fade-in">
            <span className="bg-[#242424] text-[#FAFAFA] text-xs font-semibold px-3 py-1 rounded-full shadow-lg border border-[#3A3A3A] tracking-wider">
              STOP-LIST
            </span>
          </div>
        )}

        {/* Cook Time Badge */}
        <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] text-[#FAFAFA] font-medium flex items-center gap-1 border border-white/10 shadow-sm">
          <Clock size={11} className="text-[#A1A1AA]" />
          <span>{menu.cook_time_minutes} min</span>
        </div>
      </div>

      {/* Info & Financial Breakdown */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-[#FAFAFA] line-clamp-1" title={menu.name}>
              {menu.name}
            </h3>
          </div>
          {menu.description ? (
            <p className="text-[11px] text-[#71717A] line-clamp-2 mt-1 leading-relaxed">
              {menu.description}
            </p>
          ) : (
            <p className="text-[11px] text-[#555] italic mt-1">Tavsif kiritilmagan</p>
          )}
        </div>

        {/* Financial Transparency Box */}
        <div className="bg-[#141414] border border-[#242424] rounded-lg p-2.5 space-y-1.5 shadow-inner">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#71717A]">Sotilish narxi:</span>
            <span className="font-bold text-[#FAFAFA] text-sm tracking-wide">{formatPrice(menu.price)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#71717A]">Tan narxi:</span>
            <span className="font-medium text-[#71717A] font-mono">{formatPrice(costPrice)}</span>
          </div>
          <div className="pt-1.5 border-t border-[#1F1F1F] flex items-center justify-between text-[11px]">
            <span className="text-[#71717A] flex items-center gap-1">
              <TrendingUp size={11} className="text-[#A1A1AA]" />
              <span>Sof ustama:</span>
            </span>
            <span className="text-[#FAFAFA] font-medium bg-[#222222] px-2 py-0.5 rounded border border-[#2E2E2E]">
              +{formatPrice(margin)} ({marginPct}%)
            </span>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="pt-2 border-t border-[#242424] flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onEdit(menu)}
            className="flex-1 py-1.5 text-xs bg-[#222222] hover:bg-[#2A2A2A] text-[#FAFAFA] font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-[#2E2E2E]"
          >
            <Pencil size={12} className="text-[#A1A1AA]" />
            <span>Tahrirlash</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onToggle(menu.id, menu.is_available)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border ${
              menu.is_available
                ? 'bg-[#1E1E1E] hover:bg-[#262626] text-[#A1A1AA] border-[#2A2A2A]'
                : 'bg-[#2A2A2A] text-[#FAFAFA] border-[#383838]'
            }`}
            title={menu.is_available ? 'Stop-listga kiritish' : 'Sotuvga qaytarish'}
          >
            {menu.is_available ? 'Faol' : 'Stop'}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => onDelete(menu.id, menu.name)}
            className="p-1.5 text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#222222] rounded-lg transition-colors"
            title="O'chirish"
          >
            <Trash2 size={14} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
