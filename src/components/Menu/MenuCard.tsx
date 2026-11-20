import React from 'react';
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
    <div className="group bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden hover:border-[#F59E0B]/50 transition-all duration-300 flex flex-col justify-between shadow-lg hover:shadow-xl hover:shadow-[#F59E0B]/5 hover:-translate-y-1">
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
            <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-rose-400/40 tracking-wider">
              STOP-LIST
            </span>
          </div>
        )}

        {/* Cook Time Badge */}
        <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-xl text-[11px] text-[#FAFAFA] font-medium flex items-center gap-1 border border-white/10 shadow-sm">
          <Clock size={11} className="text-[#F59E0B]" />
          <span>{menu.cook_time_minutes} min</span>
        </div>
      </div>

      {/* Info & Financial Breakdown */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-[#FAFAFA] line-clamp-1 group-hover:text-[#F59E0B] transition-colors" title={menu.name}>
              {menu.name}
            </h3>
          </div>
          {menu.description ? (
            <p className="text-[11px] text-[#A1A1AA] line-clamp-2 mt-1 leading-relaxed">
              {menu.description}
            </p>
          ) : (
            <p className="text-[11px] text-[#555] italic mt-1">Tavsif kiritilmagan</p>
          )}
        </div>

        {/* Financial Transparency Box */}
        <div className="bg-[#121212] border border-[#282828] rounded-xl p-2.5 space-y-1.5 shadow-inner">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A1A1AA]">Sotilish narxi:</span>
            <span className="font-extrabold text-[#F59E0B] text-sm tracking-wide">{formatPrice(menu.price)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#71717A]">Tan narxi:</span>
            <span className="font-semibold text-[#A1A1AA] font-mono">{formatPrice(costPrice)}</span>
          </div>
          <div className="pt-1.5 border-t border-[#222222] flex items-center justify-between text-[11px]">
            <span className="text-[#71717A] flex items-center gap-1">
              <TrendingUp size={11} className="text-emerald-400" />
              <span>Sof ustama:</span>
            </span>
            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              +{formatPrice(margin)} ({marginPct}%)
            </span>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="pt-2 border-t border-[#2A2A2A] flex items-center gap-2">
          <button
            onClick={() => onEdit(menu)}
            className="flex-1 py-1.5 text-xs bg-[#242424] hover:bg-[#333333] text-[#FAFAFA] font-medium rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Pencil size={13} className="text-[#A1A1AA]" />
            <span>Tahrirlash</span>
          </button>

          <button
            onClick={() => onToggle(menu.id, menu.is_available)}
            className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all duration-150 active:scale-95 ${
              menu.is_available
                ? 'bg-[#242424] hover:bg-rose-500/10 hover:text-rose-400 text-[#A1A1AA]'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30'
            }`}
            title={menu.is_available ? 'Stop-listga kiritish' : 'Sotuvga qaytarish'}
          >
            {menu.is_available ? 'Stop' : 'Faol'}
          </button>

          <button
            onClick={() => onDelete(menu.id, menu.name)}
            className="p-1.5 text-[#A1A1AA] hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors active:scale-95"
            title="O'chirish"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
