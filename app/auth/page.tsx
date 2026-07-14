'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Utensils, Phone, Lock, User, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const supabase = createClient();

  const saveSession = (client: { id: string; name: string; loyalty_points: number }) => {
    localStorage.setItem('chezosi_client', JSON.stringify(client));
  };

  const handleRegister = async () => {
    setError('');
    if (!name.trim()) { setError('Veuillez entrer votre nom.'); return; }
    if (phone.trim().length < 8) { setError('Numéro de téléphone invalide.'); return; }
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }

    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc('client_register', {
      p_name: name.trim(),
      p_phone: phone.trim(),
      p_password: password,
    });

    if (rpcError) {
      setError('Une erreur est survenue. Veuillez réessayer.');
      setLoading(false);
      return;
    }

    if (data?.error) {
      setError(data.error);
      setLoading(false);
      return;
    }

    saveSession(data);
    setSuccess(true);
    setLoading(false);
  };

  const handleLogin = async () => {
    setError('');
    if (phone.trim().length < 8) { setError('Numéro de téléphone invalide.'); return; }
    if (password.length < 6) { setError('Mot de passe trop court.'); return; }

    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc('client_login', {
      p_phone: phone.trim(),
      p_password: password,
    });

    if (rpcError) {
      setError('Une erreur est survenue. Veuillez réessayer.');
      setLoading(false);
      return;
    }

    if (data?.error) {
      setError(data.error);
      setLoading(false);
      return;
    }

    saveSession(data);
    router.push('/?tab=commander');
  };

  if (success) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Compte créé !</h2>
          <p className="text-charcoal-300 mb-8">
            Bienvenue chez Chez OSI ! Vous pouvez maintenant passer votre première commande et cumuler des points de fidélité.
          </p>
          <Link
            href="/?tab=commander"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors w-full justify-center"
          >
            <Utensils className="w-5 h-5" />
            Commander maintenant
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal-900 flex flex-col">
      <div className="px-4 py-6">
        <Link href="/" className="inline-flex items-center gap-2 text-charcoal-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Retour au site</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
              <Utensils className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-3xl font-bold text-white">Chez OSI</h1>
            <p className="text-charcoal-400 mt-1">Votre espace fidélité &amp; commandes</p>
          </div>

          {/* Tabs */}
          <div className="flex bg-charcoal-800 rounded-xl p-1 mb-8 border border-white/5">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === m
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-charcoal-400 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Se connecter' : "S'inscrire"}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="bg-charcoal-800 rounded-2xl p-6 border border-white/5 space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label className="block text-sm font-medium text-charcoal-300 mb-2">Votre nom complet</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-500" />
                    <input
                      type="text"
                      placeholder="Ex: Kofi Agbonou"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-charcoal-700 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-charcoal-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-charcoal-300 mb-2">Numéro de téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-500" />
                <input
                  type="tel"
                  placeholder="Ex: 0197179911"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-charcoal-700 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-charcoal-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-charcoal-300 mb-2">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
                  className="w-full bg-charcoal-700 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-white placeholder:text-charcoal-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
              >
                {error}
              </motion.p>
            )}

            {/* Submit */}
            <button
              onClick={mode === 'login' ? handleLogin : handleRegister}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>

            <p className="text-center text-charcoal-500 text-xs mt-6">
              En vous inscrivant, vous rejoignez le programme de fidélité Chez OSI.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
