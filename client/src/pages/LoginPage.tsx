import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { ShieldCheck, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authService } from '@/lib/services';
import { useAuthStore } from '@/store/authStore';
import { getApiError } from '@/lib/api';
import type { User } from '@/types';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  async function onSubmit(data: LoginForm) {
    setServerError('');
    try {
      const result = await authService.login(data.email, data.password);
      setAuth(result.user as User, result.token);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(getApiError(err));
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald/3 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald/2 rounded-full blur-3xl" />
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(#35D07F 1px, transparent 1px), linear-gradient(90deg, #35D07F 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <motion.div
        className="w-full max-w-sm relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <motion.div
            className="w-14 h-14 rounded-2xl bg-emerald/10 border border-emerald/25 flex items-center justify-center mb-5"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <ShieldCheck className="w-7 h-7 text-emerald" />
          </motion.div>
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-2xl font-black text-warm-white tracking-[0.15em]">VERITY</h1>
            <p className="text-xs text-warm-muted tracking-[0.3em] uppercase mt-1">Administrator Access</p>
          </motion.div>
        </div>

        {/* Card */}
        <motion.div
          className="verity-card p-7"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-warm-white">Sign in</h2>
            <p className="text-sm text-warm-muted mt-0.5">Access the document management console.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              autoFocus
              leftElement={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
              })}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              leftElement={<Lock className="w-4 h-4" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-warm-muted hover:text-warm-white transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password', { required: 'Password is required' })}
            />

            {serverError && (
              <motion.p
                className="text-sm text-status-revoked bg-status-revoked/5 border border-status-revoked/20 rounded-lg px-3 py-2"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
              >
                {serverError}
              </motion.p>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              loading={isSubmitting}
            >
              Sign in
            </Button>
          </form>
        </motion.div>

        <p className="text-center text-xs text-warm-muted mt-6 opacity-50">
          Verity — Digital Document Verification Platform
        </p>
      </motion.div>
    </div>
  );
}
