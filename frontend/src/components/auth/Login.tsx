import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from '../ui/Logo';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (type: 'admin' | 'member') => {
    if (type === 'admin') {
      setEmail('admin@KairiX.io');
      setPassword('Admin@123');
    } else {
      setEmail('john@projectflow.io');
      setPassword('John@123');
    }
    setShowDemo(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center p-4">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-indigo-500/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-8 rounded-3xl shadow-2xl shadow-black/40">
          {/* Logo */}
          <div className="text-center mb-8">
            <Logo className="mb-2" animated={true} />
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mt-3">
              Sign in to your workspace
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                id="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.04] text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm font-medium"
                placeholder="you@company.com"
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-white/[0.08] bg-white/[0.04] text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm font-medium"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors p-0.5"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-xl transition-all font-bold shadow-lg shadow-indigo-500/20 text-sm mt-2 relative overflow-hidden group"
            >
              <span className="relative z-10">
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : 'Sign in to KairiX'}
              </span>
            </button>
          </form>

          {/* Sign up link */}
          <div className="mt-5 text-center">
            <p className="text-gray-600 text-xs font-medium">
              Don't have an account?{' '}
              <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                Request access
              </Link>
            </p>
          </div>

          {/* Demo credentials — collapsed by default */}
          <div className="mt-5 pt-5 border-t border-white/[0.06]">
            <button
              onClick={() => setShowDemo(!showDemo)}
              className="w-full flex items-center justify-between text-[10px] font-black text-gray-600 uppercase tracking-widest hover:text-gray-400 transition-colors group"
            >
              <span>Demo Access</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${showDemo ? 'rotate-180' : ''}`} />
            </button>

            {showDemo && (
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => fillDemo('admin')}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl transition-all group"
                >
                  <div className="text-left">
                    <p className="text-xs font-bold text-indigo-400">Admin Account</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">Full workspace access</p>
                  </div>
                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-wider bg-indigo-500/10 px-2 py-1 rounded-lg">
                    Use →
                  </span>
                </button>
                <button
                  onClick={() => fillDemo('member')}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] rounded-xl transition-all"
                >
                  <div className="text-left">
                    <p className="text-xs font-bold text-gray-400">Member Account</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">Standard team member</p>
                  </div>
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider bg-white/[0.05] px-2 py-1 rounded-lg">
                    Use →
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
