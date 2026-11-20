import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2, Lock, Upload, ShieldCheck,
  Phone, MapPin, Store, UserCheck, KeyRound, Database, RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../lib/toast';
import Button from '../../components/UI/Button';
import { managerApi } from '../../lib/managerClient';
import { authService } from '../../lib/authService';

const orgSchema = z.object({
  name: z.string().min(2, "Restoran nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  address: z.string().optional(),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  current: z.string().min(4, "Joriy parol kamida 4 ta belgidan iborat bo'lishi kerak"),
  new: z.string().min(4, "Yangi parol kamida 4 ta belgidan iborat bo'lishi kerak"),
  confirm: z.string().min(4, "Tasdiqlash kamida 4 ta belgidan iborat bo'lishi kerak"),
}).refine(data => data.new === data.confirm, {
  message: "Yangi parollar bir-biriga mos kelmadi",
  path: ["confirm"],
});

type OrgFormData = z.infer<typeof orgSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const SettingsPage: React.FC = () => {
  const { user, organization, loadProfile } = useAuthStore();
  const { success, error: toastError } = useToast();
  const [uploading, setUploading] = useState(false);

  // Restaurant details form
  const {
    register: regOrg,
    handleSubmit: handleOrgSubmit,
    formState: { errors: orgErrors, isSubmitting: orgSubmitting }
  } = useForm<OrgFormData>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: organization?.name ?? '',
      address: organization?.address ?? '',
      phone: organization?.phone ?? '',
    },
  });

  // Password change form
  const {
    register: regPass,
    handleSubmit: handlePassSubmit,
    reset: resetPass,
    formState: { errors: passErrors, isSubmitting: passSubmitting }
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onOrgSubmit = async (data: OrgFormData) => {
    try {
      const res = await managerApi.organization.updateOrganization({
        name: data.name,
        address: data.address,
        phone: data.phone,
      });
      if (res.success) {
        success("Restoran ma'lumotlari muvaffaqiyatli saqlandi!");
        loadProfile();
      } else {
        toastError(res.error?.message || "Xatolik yuz berdi");
      }
    } catch {
      toastError("Xatolik yuz berdi");
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      const res = await authService.changePassword(data);
      if (res.success) {
        success("Parol muvaffaqiyatli o'zgartirildi!");
        resetPass();
      } else {
        toastError(res.error?.message || "Parolni o'zgartirib bo'lmadi");
      }
    } catch {
      toastError("Parolni o'zgartirib bo'lmadi");
    }
  };

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toastError("Rasm hajmi 1 MB dan oshmasligi kerak");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        if (base64) {
          const res = await managerApi.organization.updateOrganization({ logo_url: base64 });
          if (res.success) {
            success("Restoran logosi yangilandi!");
            loadProfile();
          } else {
            toastError(res.error?.message || "Rasm yuklashda xatolik yuz berdi");
          }
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toastError("Rasm yuklashda xatolik yuz berdi");
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in w-full pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-xl font-bold text-[#FAFAFA] flex items-center gap-2">
            <span>Tizim va Restoran Sozlamalari</span>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#242424] text-[#A1A1AA] border border-[#2E2E2E]">
              Faol
            </span>
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Restoran profili, logosi, aloqa ma'lumotlari va xavfsizlik sozlamalari
          </p>
        </div>
      </div>

      {/* Main Full-Width Grid: Left (Profile & Info), Right (Security & System Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        {/* Left Column: Restaurant Profile Settings (7 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="lg:col-span-7 space-y-6"
        >
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 shadow-lg space-y-6">
            <div className="flex items-center gap-3 border-b border-[#262626] pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#222222] border border-[#2E2E2E] flex items-center justify-center text-[#A1A1AA]">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#FAFAFA]">Restoran Profili</h3>
                <p className="text-xs text-[#A1A1AA]">Muassasa nomi, logosi va asosiy manzili</p>
              </div>
            </div>

            {/* Logo Section */}
            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] mb-2.5">
                Restoran Logotipi
              </label>
              <div className="flex flex-wrap items-center gap-4 bg-[#141414] border border-[#262626] rounded-xl p-4">
                <div className="relative">
                  {organization?.logo_url ? (
                    <img
                      src={organization.logo_url}
                      alt="logo"
                      className="w-20 h-20 rounded-xl object-cover border-2 border-[#333] shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-[#242424] rounded-xl border-2 border-dashed border-[#3A3A3A] flex flex-col items-center justify-center text-[#71717A]">
                      <Store size={26} />
                      <span className="text-[10px] mt-1">Logo yo'q</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 flex-1 min-w-[200px]">
                  <p className="text-xs font-semibold text-[#FAFAFA]">Yangi logo yuklash</p>
                  <p className="text-[11px] text-[#71717A] leading-relaxed">
                    PNG, JPG yoki WebP formatdagi kvadrat rasm tavsiya etiladi (512x512 gacha).
                  </p>
                  <label className="inline-block pt-1 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={uploadLogo}
                      disabled={uploading}
                    />
                    <span className="inline-flex items-center gap-1.5 text-xs bg-[#242424] hover:bg-[#333] text-[#FAFAFA] border border-[#3A3A3A] px-3.5 py-1.5 rounded-xl font-medium transition-colors cursor-pointer">
                      <Upload size={13} className="text-[#F59E0B]" />
                      <span>{uploading ? 'Yuklanmoqda...' : 'Kompyuterdan tanlash'}</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Restaurant Profile Form */}
            <form onSubmit={handleOrgSubmit(onOrgSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                  Restoran Nomi <span className="text-[#F59E0B]">*</span>
                </label>
                <div className="relative">
                  <Store size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]" />
                  <input
                    {...regOrg('name')}
                    placeholder="Masalan: Dastyor Grand Restaurant"
                    className="w-full bg-[#121212] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#FAFAFA] font-medium focus:outline-none focus:border-[#F59E0B] transition-colors"
                  />
                </div>
                {orgErrors.name && <p className="text-rose-400 text-xs mt-1">{orgErrors.name.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                    Telefon Raqami
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]" />
                    <input
                      {...regOrg('phone')}
                      placeholder="+998 71 200 45 45"
                      className="w-full bg-[#121212] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B] transition-colors font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                    Manzil
                  </label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]" />
                    <input
                      {...regOrg('address')}
                      placeholder="Toshkent sh., Yunusobod t., Amir Temur sh."
                      className="w-full bg-[#121212] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B] transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" disabled={orgSubmitting} className="px-6">
                  {orgSubmitting ? 'Saqlanmoqda...' : 'Ma\'lumotlarni Saqlash'}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Right Column: Security, Password Change & System Status (5 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.08, ease: 'easeOut' }}
          className="lg:col-span-5 space-y-6"
        >
          {/* Password Change Card */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 shadow-lg space-y-5">
            <div className="flex items-center gap-3 border-b border-[#262626] pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#222222] border border-[#2E2E2E] flex items-center justify-center text-[#A1A1AA]">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#FAFAFA]">Parol va Xavfsizlik</h3>
                <p className="text-xs text-[#A1A1AA]">Admin paneliga kirish parolini o'zgartirish</p>
              </div>
            </div>

            <form onSubmit={handlePassSubmit(onPasswordSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                  Joriy Parol <span className="text-[#F59E0B]">*</span>
                </label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]" />
                  <input
                    {...regPass('current')}
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-[#121212] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B] transition-colors"
                  />
                </div>
                {passErrors.current && <p className="text-rose-400 text-[11px] mt-1">{passErrors.current.message}</p>}
                <p className="text-[10px] text-[#71717A] mt-1">Standart demo parol: <span className="font-mono text-[#F59E0B]">1234</span></p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                  Yangi Parol <span className="text-[#F59E0B]">*</span>
                </label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]" />
                  <input
                    {...regPass('new')}
                    type="password"
                    placeholder="Yangi parol..."
                    className="w-full bg-[#121212] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B] transition-colors"
                  />
                </div>
                {passErrors.new && <p className="text-rose-400 text-[11px] mt-1">{passErrors.new.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                  Yangi Parolni Qayta Kiriting <span className="text-[#F59E0B]">*</span>
                </label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]" />
                  <input
                    {...regPass('confirm')}
                    type="password"
                    placeholder="Yangi parolni tasdiqlang..."
                    className="w-full bg-[#121212] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B] transition-colors"
                  />
                </div>
                {passErrors.confirm && <p className="text-rose-400 text-[11px] mt-1">{passErrors.confirm.message}</p>}
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="secondary" disabled={passSubmitting} className="w-full">
                  {passSubmitting ? 'O\'zgartirilmoqda...' : 'Parolni Yangilash'}
                </Button>
              </div>
            </form>
          </div>

          {/* System & Active Session Info Card */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-semibold text-[#A1A1AA] flex items-center gap-1.5 uppercase tracking-wider">
              <Database size={13} className="text-[#A1A1AA]" />
              <span>Tizim va Holat</span>
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-[#141414] rounded-xl border border-[#242424]">
                <span className="text-[#71717A] flex items-center gap-1.5">
                  <UserCheck size={14} className="text-[#A1A1AA]" />
                  <span>Joriy foydalanuvchi:</span>
                </span>
                <span className="font-medium text-[#FAFAFA]">{user?.full_name || 'Admin'} ({user?.username || 'admin'})</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#141414] rounded-xl border border-[#242424]">
                <span className="text-[#71717A] flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#A1A1AA]" />
                  <span>Xavfsizlik darajasi:</span>
                </span>
                <span className="font-medium text-[#FAFAFA]">Himoyalangan</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#141414] rounded-xl border border-[#242424]">
                <span className="text-[#71717A] flex items-center gap-1.5">
                  <RefreshCw size={14} className="text-[#A1A1AA]" />
                  <span>Baza holati:</span>
                </span>
                <span className="font-medium text-[#FAFAFA]">Mahalliy (Offline Store)</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
