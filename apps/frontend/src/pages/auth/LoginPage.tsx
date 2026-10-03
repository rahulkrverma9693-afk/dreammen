import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Scissors, Sparkles } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuthStore } from '../../stores/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('owner@dreamgirlsalon.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: async (creds: { email: string; password: string }) => {
      const res = await api.post('/auth/login', creds);
      return res.data.data;
    },
    onSuccess: (data) => {
      login(data.user, data.accessToken, data.refreshToken);
      toast.success(`Welcome back, ${data.user.name}! 🌹`);
      navigate('/');
    },
    onError: (error: any) => {
      // SECURITY: A failed login must ALWAYS show an error.
      // There is no demo fallback — doing so would bypass authentication entirely.
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Login failed. Please check your credentials.';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-rose-gradient relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Decorative circles */}
        <div className="absolute top-[-100px] right-[-100px] w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute bottom-[-80px] left-[-80px] w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-white/5" />

        <div className="relative z-10 text-center text-white">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Scissors size={40} className="text-white" />
            </div>
          </div>

          <h1 className="font-heading font-bold text-5xl mb-3 tracking-tight">DreamGirl</h1>
          <p className="font-heading text-2xl font-medium text-pink-100 mb-2">Family Salon</p>
          <div className="flex items-center justify-center gap-2 mt-4 mb-8">
            <Sparkles size={16} className="text-pink-200" />
            <p className="text-pink-100 text-sm">Complete Salon Management Platform</p>
            <Sparkles size={16} className="text-pink-200" />
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-left">
            {[
              { label: 'Smart Billing',     desc: '6 billing types' },
              { label: 'Appointments',      desc: 'Calendar booking' },
              { label: 'CRM & Wallet',      desc: 'Loyalty programs' },
              { label: 'Analytics',         desc: 'Real-time reports' },
            ].map((f) => (
              <div key={f.label} className="bg-white/10 backdrop-blur-sm rounded-card p-3">
                <p className="font-heading font-semibold text-sm">{f.label}</p>
                <p className="text-pink-200 text-xs mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#FFFAFA]">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-rose-gradient flex items-center justify-center shadow-card">
              <Scissors size={20} className="text-white" />
            </div>
            <div>
              <p className="font-heading font-bold text-xl text-gradient-rose">DreamGirl Salon</p>
              <p className="text-xs text-text-secondary">Management Software</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="font-heading font-bold text-3xl text-text-primary mb-2">Welcome back</h2>
            <p className="text-text-secondary">Sign in to access your salon dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@dreamgirlsalon.in"
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full justify-center flex items-center gap-2 h-12"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-text-secondary">
            🌹 DreamGirl Family Salon — v1.0 © 2026
          </p>
        </div>
      </div>
    </div>
  );
}
