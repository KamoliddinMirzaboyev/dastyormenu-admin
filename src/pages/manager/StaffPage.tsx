import React, { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { staffSchema, type StaffFormData } from '../../lib/validators';
import { Plus, Eye, EyeOff, Copy, RefreshCw, Trash2, X, Users, Wallet } from 'lucide-react';
import { UserProfile, formatPrice, toTiyin } from '../../lib/types';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../lib/toast';
import { TableSkeleton } from '../../components/UI/LoadingSkeleton';
import Button from '../../components/UI/Button';
import { staffService } from '../../lib/staffService';

const generatePassword = () => {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const roleLabels: Record<string, string> = {
  manager: 'Menejer',
  chef: 'Bosh oshpaz',
  waiter: 'Ofitsiant',
};

const PasswordCell: React.FC<{ password: string }> = ({ password }) => {
  const [visible, setVisible] = useState(false);
  const { success } = useToast();

  const copy = () => {
    navigator.clipboard.writeText(password);
    success('PIN/Parol nusxalandi');
  };

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm text-[#FAFAFA]">{visible ? password : '••••'}</span>
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
}> = ({ open, onClose, orgId, onRefetch }) => {
  const { success, error: toastError } = useToast();

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: { 
      role: 'waiter', 
      username: '', 
      password: generatePassword(),
      monthly_salary_som: 4000000,
    },
  });

  const onSubmit = async (data: StaffFormData) => {
    if (!orgId) {
      toastError('Organization ID topilmadi');
      return;
    }

    try {
      const salaryTiyin = data.monthly_salary_som ? toTiyin(data.monthly_salary_som) : 400000000;

      const response = await staffService.createStaff({
        organization: orgId,
        username: data.username,
        password: data.password,
        full_name: data.full_name,
        role: data.role,
        pin_code: data.password,
        monthly_salary: salaryTiyin,
        is_active: true,
      });

      if (response.success) {
        success('Xodim muvaffaqiyatli qo\'shildi');
        onRefetch();
        onClose();
      } else {
        toastError(response.error?.message || 'Xodim qo\'shilmadi');
      }
    } catch (error) {
      toastError('Xatolik yuz berdi');
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#161616] border border-[#2A2A2A] rounded-xl p-6 z-50 shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-base font-bold text-[#FAFAFA]">Yangi Xodim Qo'shish</Dialog.Title>
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
                <label className="text-xs font-semibold text-[#A1A1AA]">PIN / Parol <span className="text-[#F59E0B]">*</span></label>
                <button 
                  type="button" 
                  onClick={() => setValue('password', generatePassword())} 
                  className="text-xs text-[#F59E0B] hover:underline flex items-center gap-1 font-semibold"
                >
                  <RefreshCw size={11} />
                  <span>Avto-generatsiya</span>
                </button>
              </div>
              <input 
                {...register('password')} 
                className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl px-3 py-2 text-sm text-[#FAFAFA] font-mono focus:outline-none focus:border-[#F59E0B]" 
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>Bekor qilish</Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Qo\'shilmoqda...' : 'Saqlash'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

const StaffPage: React.FC = () => {
  const { organization } = useAuthStore();
  const orgId = organization?.id ?? '';
  const { success, error: toastError } = useToast();

  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const response = await staffService.getStaff();
      if (response.success && response.data) {
        setStaff(response.data);
      } else {
        toastError('Xodimlar ro\'yxati yuklanmadi');
      }
    } catch (error) {
      toastError('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => { 
    fetchStaff(); 
  }, [fetchStaff]);

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const res = await staffService.toggleActive(id, current);
      if (res.success) {
        success('Holat o\'zgartirildi');
        setStaff(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s));
      }
    } catch (e) {
      toastError('Holatni o\'zgartirib bo\'lmadi');
    }
  };

  const deleteStaff = async (id: string) => {
    if (!confirm('Xodimni o\'chirishni xohlaysizmi?')) return;
    try {
      const res = await staffService.deleteStaff(id);
      if (res.success) {
        success('Xodim o\'chirildi');
        setStaff(prev => prev.filter(s => s.id !== id));
      } else {
        toastError('Xodim o\'chirilmadi');
      }
    } catch (error) {
      toastError('Xatolik yuz berdi');
    }
  };

  // Payroll summary calculations
  const totalPayroll = staff.reduce((sum, s) => {
    return sum + (s.monthly_salary || 400000000);
  }, 0);

  const avgSalary = staff.length > 0 ? Math.round(totalPayroll / staff.length) : 0;

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
        <Button icon={Plus} onClick={() => setShowForm(true)} variant="primary">
          Yangi xodim qo'shish
        </Button>
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
            <p className="text-xl font-bold text-[#FAFAFA]">{staff.length} <span className="text-xs font-normal text-[#A1A1AA]">nafar</span></p>
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
        ) : staff.length === 0 ? (
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
                {staff.map((member, idx) => (
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
                        {formatPrice(member.monthly_salary || 400000000)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-[#FAFAFA] font-mono bg-[#141414] px-2 py-1 rounded border border-[#2E2E2E]">
                        {member.username}
                      </span>
                    </td>
                    <td className="py-3 px-4"><PasswordCell password={member.pin_code || '1111'} /></td>
                    <td className="py-3 px-4">
                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={() => toggleActive(member.id, member.is_active)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                          member.is_active
                            ? 'bg-[#222222] text-[#FAFAFA] hover:bg-[#2A2A2A] border border-[#333333]'
                            : 'bg-[#181818] text-[#71717A] hover:bg-[#222222] border border-[#282828]'
                        }`}
                      >
                        {member.is_active ? 'Faol' : 'Nofaol'}
                      </motion.button>
                    </td>
                    <td className="py-3 px-4">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => deleteStaff(member.id)}
                        className="text-[#A1A1AA] hover:text-rose-400 p-1.5 rounded hover:bg-rose-500/10 transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 size={15} />
                      </motion.button>
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
        onClose={() => setShowForm(false)}
        orgId={orgId}
        onRefetch={fetchStaff}
      />
    </div>
  );
};

export default StaffPage;
