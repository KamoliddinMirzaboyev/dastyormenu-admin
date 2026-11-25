import React, { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  staffSchema,
  staffUpdateSchema,
  staffPasswordSchema,
  type StaffUpdateFormData,
  type StaffPasswordFormData,
} from '../../lib/validators';
import { Plus, Eye, EyeOff, Copy, RefreshCw, Trash2, Pencil, KeyRound, AlertTriangle, X, Users, Wallet } from 'lucide-react';
import { UserProfile, formatPrice, toTiyin } from '../../lib/types';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../lib/toast';
import { TableSkeleton } from '../../components/UI/LoadingSkeleton';
import Button from '../../components/UI/Button';
import { staffService } from '../../lib/staffService';

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const roleLabels: Record<string, string> = {
  manager: 'Menejer',
  chef: 'Bosh oshpaz',
  waiter: 'Ofitsiant',
};

const PasswordCell: React.FC<{ password?: string }> = ({ password }) => {
  const [visible, setVisible] = useState(false);
  const { success } = useToast();

  if (!password || password === '••••••') {
    return <span className="font-mono text-xs text-[#71717A]">Maxfiy (Xavfsiz)</span>;
  }

  const copy = () => {
    navigator.clipboard.writeText(password);
    success('PIN/Parol nusxalandi');
  };

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm text-[#FAFAFA]">{visible ? password : '••••••'}</span>
      <button onClick={() => setVisible(v => !v)} className="text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors">
        {visible ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
      <button onClick={copy} className="text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors" title="Nusxalash">
        <Copy size={13} />
      </button>
    </div>
  );
};

const StaffFormModal: React.FC<{
  open: boolean;
  onClose: () => void;
  orgId: string;
  onRefetch: () => void;
  staffToEdit?: UserProfile | null;
}> = ({ open, onClose, orgId, onRefetch, staffToEdit }) => {
  const { success, error: toastError } = useToast();
  const isEdit = Boolean(staffToEdit);
  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<StaffUpdateFormData>({
    resolver: zodResolver(isEdit ? staffUpdateSchema : staffSchema),
    defaultValues: {
      role: 'waiter',
      username: '',
      full_name: '',
      email: '',
      password: generatePassword(),
      pin_code: '',
      monthly_salary_som: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    if (staffToEdit) {
      reset({
        full_name: staffToEdit.full_name || '',
        role: (staffToEdit.role === 'chef' || staffToEdit.role === 'waiter') ? staffToEdit.role : 'waiter',
        username: staffToEdit.username || '',
        email: staffToEdit.email || '',
        password: '',
        pin_code: '',
        monthly_salary_som: staffToEdit.monthly_salary ? Math.round(staffToEdit.monthly_salary / 100) : 0,
        is_active: staffToEdit.is_active ?? true,
      });
    } else {
      reset({
        role: 'waiter',
        username: '',
        full_name: '',
        email: '',
        password: generatePassword(),
        pin_code: '',
        monthly_salary_som: 4000000,
        is_active: true,
      });
    }
  }, [open, staffToEdit, reset]);

  const onSubmit = async (data: StaffUpdateFormData) => {
    setFormError(null);
    if (!isEdit && !orgId) {
      toastError('Organization ID topilmadi');
      return;
    }

    try {
      const salaryTiyin = data.monthly_salary_som !== undefined && !Number.isNaN(data.monthly_salary_som)
        ? toTiyin(data.monthly_salary_som)
        : (isEdit ? undefined : 0);

      if (isEdit && staffToEdit) {
        const updatePayload: Record<string, unknown> = {};
        const trimmedUsername = data.username.trim();
        const trimmedFullName = data.full_name.trim();
        const trimmedEmail = data.email?.trim() || '';

        if (trimmedUsername !== staffToEdit.username) {
          updatePayload.username = trimmedUsername;
        }
        if (trimmedFullName !== (staffToEdit.full_name || '')) {
          updatePayload.full_name = trimmedFullName;
        }
        if (data.role !== staffToEdit.role) {
          updatePayload.role = data.role;
        }
        if (trimmedEmail && trimmedEmail !== (staffToEdit.email || '')) {
          updatePayload.email = trimmedEmail;
        }
        if (data.password && data.password.trim() !== '') {
          updatePayload.password = data.password;
        }
        if (data.pin_code && data.pin_code.trim() !== '') {
          updatePayload.pin_code = data.pin_code.trim();
        }
        if (salaryTiyin !== undefined && salaryTiyin !== (staffToEdit.monthly_salary || 0)) {
          updatePayload.monthly_salary = salaryTiyin;
        }
        if (data.is_active !== undefined && data.is_active !== (staffToEdit.is_active ?? true)) {
          updatePayload.is_active = data.is_active;
        }

        if (Object.keys(updatePayload).length === 0) {
          onClose();
          return;
        }

        const response = await staffService.updateStaff(staffToEdit.id, updatePayload);

        if (response.success) {
          success('Xodim ma\'lumotlari yangilandi');
          onRefetch();
          onClose();
        } else {
          console.error('Staff update failed:', response.error);
          const msg = response.error?.message || 'Xodim ma\'lumotlari yangilanmadi';
          setFormError(msg);
          toastError(msg);
        }
        return;
      }

      const response = await staffService.createStaff({
        organization: orgId,
        username: data.username,
        password: data.password || '',
        full_name: data.full_name,
        role: data.role,
        monthly_salary: salaryTiyin ?? 0,
        is_active: true,
      });

      if (response.success) {
        success('Xodim muvaffaqiyatli qo\'shildi');
        onRefetch();
        onClose();
      } else {
        console.error('Staff create failed:', response.error);
        const msg = response.error?.message || 'Xodim qo\'shilmadi';
        setFormError(msg);
        toastError(msg);
      }
    } catch {
      setFormError('Xatolik yuz berdi');
      toastError('Xatolik yuz berdi');
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#161616] border border-[#2A2A2A] rounded-xl p-6 z-50 shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-base font-bold text-[#FAFAFA]">
              {isEdit ? 'Xodim Ma\'lumotlarini Tahrirlash' : 'Yangi Xodim Qo\'shish'}
            </Dialog.Title>
            <Dialog.Close className="text-[#A1A1AA] hover:text-[#FAFAFA] p-1.5 rounded-lg hover:bg-[#2A2A2A]"><X size={18} /></Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">To'liq ismi <span className="text-[#F59E0B]">*</span></label>
              <input
                {...register('full_name')}
                placeholder="Masalan: Sardor Aliyev"
                className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl px-3 py-2 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
              />
              {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">Lavozim <span className="text-[#F59E0B]">*</span></label>
                <select
                  {...register('role')}
                  className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl px-3 py-2 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
                >
                  <option value="waiter">Ofitsiant</option>
                  <option value="chef">Oshpaz</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">Oylik maoshi (so'm)</label>
                <input
                  {...register('monthly_salary_som', { valueAsNumber: true })}
                  type="number"
                  placeholder="4000000"
                  className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl px-3 py-2 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
                />
                {errors.monthly_salary_som && <p className="text-red-400 text-xs mt-1">{errors.monthly_salary_som.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">Login <span className="text-[#F59E0B]">*</span></label>
              <input
                {...register('username')}
                placeholder="sardor_01"
                className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl px-3 py-2 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
              />
              {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#A1A1AA]">
                  {isEdit ? 'Yangi parol (ixtiyoriy)' : <>PIN / Parol <span className="text-[#F59E0B]">*</span></>}
                </label>
                <button
                  type="button"
                  onClick={() => setValue('password', generatePassword(), { shouldValidate: true })}
                  className="text-xs text-[#F59E0B] hover:underline flex items-center gap-1 font-semibold"
                >
                  <RefreshCw size={11} />
                  <span>Avto-generatsiya</span>
                </button>
              </div>
              <input
                {...register('password')}
                placeholder={isEdit ? "O'zgartirmaslik uchun bo'sh qoldiring (kamida 8 belgi)" : 'Kamida 8 ta belgi'}
                className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl px-3 py-2 text-sm text-[#FAFAFA] font-mono focus:outline-none focus:border-[#F59E0B]"
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {isEdit && (
              <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  {...register('is_active')}
                  className="w-4 h-4 accent-[#F59E0B] rounded"
                />
                <span className="text-xs font-medium text-[#FAFAFA]">Xodim faol (tizimga kira oladi)</span>
              </label>
            )}

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {formError}
              </div>
            )}

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

const StaffPasswordModal: React.FC<{
  member: UserProfile | null;
  onClose: () => void;
  onRefetch: () => void;
}> = ({ member, onClose, onRefetch }) => {
  const { success, error: toastError } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<StaffPasswordFormData>({
    resolver: zodResolver(staffPasswordSchema),
    defaultValues: { password: '', pin_code: '' },
  });

  useEffect(() => {
    if (member) {
      reset({ password: '', pin_code: '' });
      setShowPassword(false);
      setFormError(null);
    }
  }, [member, reset]);

  const currentPassword = watch('password');

  const copyPassword = () => {
    if (!currentPassword) return;
    navigator.clipboard.writeText(currentPassword);
    success('Yangi parol nusxalandi');
  };

  const onSubmit = async (data: StaffPasswordFormData) => {
    if (!member) return;
    setFormError(null);
    try {
      const response = await staffService.updateStaff(member.id, {
        password: data.password?.trim() || undefined,
        pin_code: data.pin_code?.trim() || undefined,
      });

      if (response.success) {
        success(`${member.full_name || member.username} paroli yangilandi`);
        onRefetch();
        onClose();
      } else {
        console.error('Staff password update failed:', response.error);
        const msg = response.error?.message || 'Parol yangilanmadi';
        setFormError(msg);
        toastError(msg);
      }
    } catch {
      setFormError('Xatolik yuz berdi');
      toastError('Xatolik yuz berdi');
    }
  };

  return (
    <Dialog.Root open={Boolean(member)} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#161616] border border-[#2A2A2A] rounded-xl p-6 z-50 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Dialog.Title className="text-base font-bold text-[#FAFAFA]">Parol / PIN Yangilash</Dialog.Title>
              {member && (
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  {member.full_name || member.username} ({member.username})
                </p>
              )}
            </div>
            <Dialog.Close className="text-[#A1A1AA] hover:text-[#FAFAFA] p-1.5 rounded-lg hover:bg-[#2A2A2A]"><X size={18} /></Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#A1A1AA]">Yangi parol</label>
                <button
                  type="button"
                  onClick={() => {
                    setValue('password', generatePassword(), { shouldValidate: true });
                    setShowPassword(true);
                  }}
                  className="text-xs text-[#F59E0B] hover:underline flex items-center gap-1 font-semibold"
                >
                  <RefreshCw size={11} />
                  <span>Avto-generatsiya</span>
                </button>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Kamida 8 ta belgi"
                  className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl pl-3 pr-16 py-2 text-sm text-[#FAFAFA] font-mono focus:outline-none focus:border-[#F59E0B]"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="p-1 text-[#A1A1AA] hover:text-[#FAFAFA]"
                    title={showPassword ? 'Yashirish' : 'Ko\'rsatish'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  {currentPassword && (
                    <button
                      type="button"
                      onClick={copyPassword}
                      className="p-1 text-[#A1A1AA] hover:text-[#FAFAFA]"
                      title="Nusxalash"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                </div>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {formError}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>Bekor qilish</Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Yangilanmoqda...' : 'Yangilash'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

const DeleteStaffModal: React.FC<{
  member: UserProfile | null;
  onClose: () => void;
  onConfirm: (member: UserProfile) => Promise<void>;
  deleting: boolean;
  error?: string | null;
}> = ({ member, onClose, onConfirm, deleting, error }) => {
  return (
    <Dialog.Root open={Boolean(member)} onOpenChange={v => !v && !deleting && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#161616] border border-[#2A2A2A] rounded-xl p-6 z-50 shadow-2xl">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-base font-bold text-[#FAFAFA]">
                Rostdan ham o'chirmoqchimisiz?
              </Dialog.Title>
              {member && (
                <p className="text-xs text-[#A1A1AA] mt-1">
                  <span className="text-[#FAFAFA] font-semibold">{member.full_name || member.username}</span> ({member.username}) xodimlar ro'yxatidan o'chiriladi.
                </p>
              )}
            </div>
            <Dialog.Close disabled={deleting} className="text-[#A1A1AA] hover:text-[#FAFAFA] p-1 rounded-lg hover:bg-[#2A2A2A]">
              <X size={16} />
            </Dialog.Close>
          </div>

          {error && (
            <div className="mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={deleting}>
              Bekor qilish
            </Button>
            <button
              type="button"
              disabled={deleting || !member}
              onClick={() => member && onConfirm(member)}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors disabled:opacity-50"
            >
              {deleting ? 'O\'chirilmoqda...' : 'Ha, o\'chirish'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

const StaffPage: React.FC = () => {
  const { organization } = useAuthStore();
  const orgId = organization?.id ?? '';
  const { success, error: toastError } = useToast();

  const initialCached = staffService.getCachedStaff();
  const [staff, setStaff] = useState<UserProfile[]>(initialCached ?? []);
  const [loading, setLoading] = useState(!initialCached);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<UserProfile | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<UserProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

    const fetchStaff = useCallback(async (force = false, silent = false) => {
      if (!silent) setLoading(true);
      try {
        const response = await staffService.getStaff(force);
        if (response.success && response.data) {
          setStaff(response.data);
        } else {
          toastError(response.error?.message || 'Xodimlar ro\'yxati yuklanmadi');
        }
      } catch {
        toastError('Xatolik yuz berdi');
      } finally {
        if (!silent) setLoading(false);
      }
    }, [toastError]);

    useEffect(() => {
      fetchStaff(true, Boolean(staffService.getCachedStaff()));
    }, [fetchStaff]);

    const toggleActive = async (id: string, current: boolean) => {
      try {
        const res = await staffService.toggleActive(id, current);
        if (res.success) {
          success('Holat o\'zgartirildi');
          setStaff(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s));
        } else {
          toastError(res.error?.message || 'Holatni o\'zgartirib bo\'lmadi');
        }
      } catch {
        toastError('Holatni o\'zgartirib bo\'lmadi');
      }
    };

    const confirmDeleteStaff = async (member: UserProfile) => {
      setDeleting(true);
      setDeleteError(null);
      try {
        const res = await staffService.deleteStaff(member.id);
        if (res.success) {
          success('Xodim o\'chirildi');
          setStaff(prev => prev.filter(s => s.id !== member.id));
          setDeleteTarget(null);
          fetchStaff(true, true);
        } else {
          console.error('Staff delete failed:', res.error);
          const msg = res.error?.message || 'Xodim o\'chirilmadi';
          setDeleteError(msg);
          toastError(msg);
        }
      } catch {
        setDeleteError('Xatolik yuz berdi');
        toastError('Xatolik yuz berdi');
      } finally {
        setDeleting(false);
      }
    };

    const inactiveCount = staff.filter(s => !s.is_active).length;
    const visibleStaff = showInactive ? staff : staff.filter(s => s.is_active);

    // Payroll summary calculations
    const totalPayroll = visibleStaff.reduce((sum, s) => {
      return sum + (s.monthly_salary || 0);
    }, 0);

    const avgSalary = visibleStaff.length > 0 ? Math.round(totalPayroll / visibleStaff.length) : 0;

    return (
      <div className="space-y-5">
        {/* Top Controls & Payroll Overview */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#FAFAFA]">Xodimlar va Oylik Maoshlar</h2>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Xodimlar tarkibi, lavozimlar va oylik ish haqi fondi boshqaruvi
            </p>
          </div>
          <div className="flex items-center gap-2">
            {inactiveCount > 0 && (
              <Button
                variant="secondary"
                onClick={() => setShowInactive(v => !v)}
              >
                {showInactive ? 'Faqat faollar' : `Nofaollar (${inactiveCount})`}
              </Button>
            )}
            <Button icon={Plus} onClick={() => setShowForm(true)} variant="primary">
              Yangi xodim qo'shish
            </Button>
          </div>
        </div>

        {/* Salary & Staff Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 flex items-center gap-3.5 hover:border-[#383838] transition-colors shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-[#222222] border border-[#2E2E2E] flex items-center justify-center text-[#FAFAFA] shrink-0">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs text-[#A1A1AA]">Jami Xodimlar</p>
              <p className="text-xl font-bold text-[#FAFAFA]">{visibleStaff.length} <span className="text-xs font-normal text-[#A1A1AA]">nafar</span></p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 flex items-center gap-3.5 hover:border-[#383838] transition-colors shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-[#222222] border border-[#2E2E2E] flex items-center justify-center text-[#F59E0B] shrink-0">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-xs text-[#A1A1AA]">Jami Oylik Maosh Fondi</p>
              <p className="text-xl font-bold text-[#FAFAFA]">{formatPrice(totalPayroll)} <span className="text-xs font-normal text-[#A1A1AA]">/ oy</span></p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 flex items-center gap-3.5 hover:border-[#383838] transition-colors shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-[#222222] border border-[#2E2E2E] flex items-center justify-center text-[#FAFAFA] shrink-0">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-xs text-[#A1A1AA]">O'rtacha Oylik Maosh</p>
              <p className="text-xl font-bold text-[#FAFAFA]">{formatPrice(avgSalary)}</p>
            </div>
          </motion.div>
        </div>

        {/* Table */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-lg">
          {loading ? (
            <div className="p-6"><TableSkeleton rows={5} cols={6} /></div>
          ) : visibleStaff.length === 0 ? (
            <div className="py-16 text-center text-[#A1A1AA]">
              <p className="text-4xl mb-3">👥</p>
              <p className="text-sm font-semibold text-[#FAFAFA]">Xodimlar topilmadi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2A2A2A] bg-[#141414]/50">
                    {['Xodim', 'Lavozim', 'Oylik Maoshi', 'Login', 'PIN/Parol', 'Holat', 'Harakatlar'].map(h => (
                      <th key={h} className="text-left py-3.5 px-4 text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleStaff.map((member, idx) => (
                    <motion.tr
                      key={member.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: Math.min(idx * 0.03, 0.3) }}
                      className="border-b border-[#2A2A2A]/50 hover:bg-[#242424]/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#242424] border border-[#333333] rounded-xl flex items-center justify-center shrink-0">
                            <span className="text-[#FAFAFA] text-xs font-bold">{(member.full_name || member.username).charAt(0)}</span>
                          </div>
                          <span className="text-sm font-semibold text-[#FAFAFA]">{member.full_name || member.username}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-[#222222] text-[#FAFAFA] border border-[#2E2E2E]">
                          {roleLabels[member.role] ?? member.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-bold text-[#FAFAFA] font-mono">
                          {formatPrice(member.monthly_salary || 0)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-[#FAFAFA] font-mono bg-[#141414] px-2 py-1 rounded border border-[#2E2E2E]">
                          {member.username}
                        </span>
                      </td>
                      <td className="py-3 px-4"><PasswordCell password={member.pin_code} /></td>
                      <td className="py-3 px-4">
                        <motion.button
                          whileTap={{ scale: 0.94 }}
                          onClick={() => toggleActive(member.id, member.is_active)}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${member.is_active
                              ? 'bg-[#222222] text-[#FAFAFA] hover:bg-[#2A2A2A] border border-[#333333]'
                              : 'bg-[#181818] text-[#71717A] hover:bg-[#222222] border border-[#282828]'
                            }`}
                        >
                          {member.is_active ? 'Faol' : 'Nofaol'}
                        </motion.button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setEditingStaff(member);
                              setShowForm(true);
                            }}
                            className="text-[#A1A1AA] hover:text-[#F59E0B] p-1.5 rounded hover:bg-[#F59E0B]/10 transition-colors"
                            title="Ma'lumotlarni tahrirlash"
                          >
                            <Pencil size={15} />
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setPasswordTarget(member)}
                            className="text-[#A1A1AA] hover:text-sky-400 p-1.5 rounded hover:bg-sky-500/10 transition-colors"
                            title="Parol / PIN o'zgartirish"
                          >
                            <KeyRound size={15} />
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTarget(member);
                            }}
                            className="text-[#A1A1AA] hover:text-rose-400 p-1.5 rounded hover:bg-rose-500/10 transition-colors"
                            title="O'chirish"
                          >
                            <Trash2 size={15} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <StaffFormModal
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingStaff(null);
          }}
          orgId={orgId}
          onRefetch={() => fetchStaff(true, true)}
          staffToEdit={editingStaff}
        />

        <StaffPasswordModal
          member={passwordTarget}
          onClose={() => setPasswordTarget(null)}
          onRefetch={() => fetchStaff(true, true)}
        />

        <DeleteStaffModal
          member={deleteTarget}
          onClose={() => {
            setDeleteTarget(null);
            setDeleteError(null);
          }}
          onConfirm={confirmDeleteStaff}
          deleting={deleting}
          error={deleteError}
        />
      </div>
    );
  };

  export default StaffPage;
