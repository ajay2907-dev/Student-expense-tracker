import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { User as UserType } from '../types';

interface AuthModalProps {
  onSuccess: (user: UserType) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [name, setName] = useState<string>('Alex Johnson');
  const [email, setEmail] = useState<string>('alex.student@university.edu');
  const [password, setPassword] = useState<string>('password123');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      setLoading(true);
      let res;
      if (isLogin) {
        res = await api.login(email, password);
      } else {
        res = await api.register(name, email, password);
      }

      if (res.user) {
        onSuccess(res.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="glass-panel light:bg-white rounded-3xl p-8 max-w-md w-full border border-white/10 shadow-2xl space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#d0bcff] to-[#ffb0cd] flex items-center justify-center text-[#3c0091] mx-auto shadow-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white light:text-slate-900 tracking-tight">
            {isLogin ? 'Student Login' : 'Create Student Account'}
          </h2>
          <p className="text-xs text-[#cbc3d7] light:text-slate-500">
            {isLogin
              ? 'Enter your student credentials to sync your expenses.'
              : 'Sign up to track student budgets, goals, and analytics.'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold uppercase text-[#cbc3d7] mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#cbc3d7]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Johnson"
                  className="w-full bg-black/20 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:border-[#d0bcff] transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-[#cbc3d7] mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#cbc3d7]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.student@university.edu"
                className="w-full bg-black/20 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:border-[#d0bcff] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[#cbc3d7] mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#cbc3d7]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/20 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:border-[#d0bcff] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 pt-3 active:scale-95 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : isLogin ? 'Log In' : 'Register Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-white/10">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-[#d0bcff] hover:underline font-semibold transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already registered? Log In'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
