import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LogIn, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../lib/toast';

const schema = z.object({
  login: z.string().min(1, 'Login kiritilishi shart'),
  password: z.string().min(1, 'Parol kiritilishi shart'),
});

type FormData = z.infer<typeof schema>;

const LoginPage: React.FC = () => {
  const { signIn } = useAuthStore();
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      login: 'admin',
      password: '1234',
    },
  });

  const handleQuickFill = () => {
    setValue('login', 'admin');
    setValue('password', '1234');
    toastSuccess('Demo login va parol kiritildi!');
  };

  const onSubmit = async (data: FormData) => {
    setApiError(null);

    const err = await signIn(data.login, data.password);
    if (err) {
      setApiError(err);
      toastError(err);
    } else {
      toastSuccess('Xush kelibsiz! Tizimga muvaffaqiyatli kirdingiz.');
      navigate('/manager');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#F59E0B] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#F59E0B]/20">
            <span className="text-black font-extrabold text-2xl">D</span>
          </div>
          <h1 className="text-2xl font-bold text-[#FAFAFA]">Dastyor Grand</h1>
          <p className="text-[#A1A1AA] text-xs mt-1">Restoran Menejer & Ofitsiant Paneli</p>
        </div>

        {/* Demo Helper Card */}
        <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-4 mb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F59E0B]">
              <KeyRound size={15} />
              <span>Demo Kirish Ma'lumotlari:</span>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={handleQuickFill}
              className="text-[11px] bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
            >
              <Sparkles size={11} />
              <span>To'ldirish</span>
            </motion.button>
          </div>
          <div className="mt-2 text-xs text-[#FAFAFA] flex items-center justify-between bg-black/40 px-3 py-1.5 rounded-lg border border-[#2E2E2E] font-mono">
            <span>Login: <strong className="text-[#F59E0B]">admin</strong></span>
            <span>Parol: <strong className="text-[#F59E0B]">1234</strong></span>
          </div>
        </div>

        {/* Error Alert */}
        {apiError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 mb-4 flex items-start gap-2.5">
            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{apiError}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                Login yoki Email
              </label>
              <input
                {...register('login')}
                type="text"
                placeholder="admin"
                className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#F59E0B] transition-colors"
                autoComplete="username"
              />
              {errors.login && <p className="text-red-400 text-xs mt-1">{errors.login.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                Parol
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="1234"
                  className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 pr-10 text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#F59E0B] transition-colors"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#FAFAFA]"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[#2A2A2A] bg-[#0F0F0F] text-[#F59E0B] focus:ring-[#F59E0B]"
                />
                <span className="text-[#A1A1AA]">Eslab qolish</span>
              </label>
              <span className="text-[#71717A]">Demo rejim</span>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold py-2.5 rounded-xl transition-colors shadow-lg shadow-[#F59E0B]/20 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Tekshirilmoqda...</span>
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Kirish</span>
                </>
              )}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-[11px] text-[#71717A] mt-6">
          Dastyor Restoran Tizimi © {new Date().getFullYear()} • 100% Oflayn Demo Rejim
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
