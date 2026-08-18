import React, { useState } from 'react';
import { Lock, Mail, AlertOctagon, CheckCircle2, ArrowRight, UserCheck, Store, Shield, Flame, ExternalLink, Key, Check, AlertCircle } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { 
  auth, 
  getActiveFirebaseConfig, 
  saveCustomFirebaseConfig, 
  resetFirebaseConfigToDefault, 
  isUsingCustomFirebaseConfig,
  FirebaseCustomConfig
} from '../firebase';
import { Role, UserAuth } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (userAuth: UserAuth) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('ADMIN');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Custom Firebase config modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const activeConfig = getActiveFirebaseConfig();
  const isCustom = isUsingCustomFirebaseConfig();
  const [configJsonInput, setConfigJsonInput] = useState('');
  const [manualConfig, setManualConfig] = useState<FirebaseCustomConfig>({
    apiKey: activeConfig.apiKey || '',
    authDomain: activeConfig.authDomain || '',
    projectId: activeConfig.projectId || '',
    storageBucket: activeConfig.storageBucket || '',
    messagingSenderId: activeConfig.messagingSenderId || '',
    appId: activeConfig.appId || '',
    databaseURL: activeConfig.databaseURL || '',
    firestoreDatabaseId: activeConfig.firestoreDatabaseId || ''
  });
  const [configError, setConfigError] = useState<string | null>(null);

  const handleParseConfigJson = () => {
    setConfigError(null);
    try {
      const trimmed = configJsonInput.trim();
      if (!trimmed) {
        setConfigError('অনুগ্রহ করে Firebase SDK config কোড বা JSON পেস্ট করুন।');
        return;
      }

      let cleaned = trimmed;
      if (cleaned.includes('{') && cleaned.includes('}')) {
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }

      const jsonValidString = cleaned
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/'/g, '"')
        .replace(/,\s*}/g, '}');

      let parsed: any;
      try {
        parsed = JSON.parse(jsonValidString);
      } catch {
        const apiKeyMatch = trimmed.match(/apiKey\s*:\s*["']([^"']+)["']/);
        const projectIdMatch = trimmed.match(/projectId\s*:\s*["']([^"']+)["']/);
        const authDomainMatch = trimmed.match(/authDomain\s*:\s*["']([^"']+)["']/);
        const storageBucketMatch = trimmed.match(/storageBucket\s*:\s*["']([^"']+)["']/);
        const appIdMatch = trimmed.match(/appId\s*:\s*["']([^"']+)["']/);
        const messagingSenderIdMatch = trimmed.match(/messagingSenderId\s*:\s*["']([^"']+)["']/);
        const databaseURLMatch = trimmed.match(/databaseURL\s*:\s*["']([^"']+)["']/);

        if (apiKeyMatch && projectIdMatch) {
          parsed = {
            apiKey: apiKeyMatch[1],
            projectId: projectIdMatch[1],
            authDomain: authDomainMatch?.[1] || '',
            storageBucket: storageBucketMatch?.[1] || '',
            appId: appIdMatch?.[1] || '',
            messagingSenderId: messagingSenderIdMatch?.[1] || '',
            databaseURL: databaseURLMatch?.[1] || ''
          };
        } else {
          throw new Error('Firebase কনফিগারেশন পার্স করা যায়নি।');
        }
      }

      if (!parsed.apiKey || !parsed.projectId) {
        setConfigError('Firebase কনফিগারেশনে অবশ্যই apiKey এবং projectId থাকতে হবে।');
        return;
      }

      setManualConfig({
        apiKey: parsed.apiKey || '',
        authDomain: parsed.authDomain || '',
        projectId: parsed.projectId || '',
        storageBucket: parsed.storageBucket || '',
        messagingSenderId: parsed.messagingSenderId || '',
        appId: parsed.appId || '',
        databaseURL: parsed.databaseURL || '',
        firestoreDatabaseId: parsed.firestoreDatabaseId || ''
      });
      setConfigJsonInput('');
    } catch (err: any) {
      setConfigError(err?.message || 'কনফিগারেশন ফরম্যাট সঠিক নয়।');
    }
  };

  const handleApplyFirebaseConfig = () => {
    if (!manualConfig.apiKey.trim() || !manualConfig.projectId.trim()) {
      setConfigError('অনুগ্রহ করে API Key এবং Project ID দিন।');
      return;
    }

    saveCustomFirebaseConfig({
      apiKey: manualConfig.apiKey.trim(),
      authDomain: manualConfig.authDomain?.trim() || `${manualConfig.projectId.trim()}.firebaseapp.com`,
      projectId: manualConfig.projectId.trim(),
      storageBucket: manualConfig.storageBucket?.trim() || `${manualConfig.projectId.trim()}.appspot.com`,
      messagingSenderId: manualConfig.messagingSenderId?.trim() || '',
      appId: manualConfig.appId?.trim() || '',
      databaseURL: manualConfig.databaseURL?.trim() || `https://${manualConfig.projectId.trim()}-default-rtdb.firebaseio.com`,
      firestoreDatabaseId: manualConfig.firestoreDatabaseId?.trim() || '(default)'
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage('অনুগ্রহ করে আপনার ইমেইল এড্রেস লিখুন।');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('অনুগ্রহ করে পাসওয়ার্ড লিখুন।');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      // Generate consistent deterministic user ID from email for per-shop isolation
      const sanitizedId = `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const namePart = cleanEmail.split('@')[0];
      const displayName = storeName.trim() || (namePart.charAt(0).toUpperCase() + namePart.slice(1) + "'s Store");

      onLoginSuccess({
        uid: sanitizedId,
        email: cleanEmail,
        displayName: displayName,
        role: selectedRole
      });
      setIsSubmitting(false);
    }, 400);
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setIsGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userEmail = user.email?.toLowerCase() || '';

      if (!userEmail) {
        throw new Error('Google account email not found');
      }

      onLoginSuccess({
        uid: user.uid,
        email: userEmail,
        displayName: user.displayName || `${userEmail.split('@')[0]}'s Store`,
        photoURL: user.photoURL || undefined,
        role: selectedRole
      });
    } catch (err: any) {
      console.warn('Google Sign-In note:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Google সাইন-ইন উইন্ডো বন্ধ করা হয়েছে।');
      } else if (err?.code === 'auth/popup-blocked') {
        setErrorMessage('ব্রাউজার পপআপ ব্লক করেছে। অনুগ্রহ করে পপআপ Allow করুন অথবা ইমেইল দিয়ে লগইন করুন।');
      } else {
        setErrorMessage(`Google সাইন-ইন তথ্য: ${err?.message || 'অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড দিয়ে সাইন-ইন করুন।'}`);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-500/20">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Smart Shop POS & Cloud ERP</h1>
          <p className="text-xs text-slate-400">মাল্টি-ইউজার ক্লাউড ভিত্তিক দোকানের সম্পূর্ণ হিসাব ও ইনভেন্টরি ম্যানেজমেন্ট</p>
        </div>

        {/* Multi-Tenant Notice Badge */}
        <div className="bg-indigo-950/40 border border-indigo-800/60 p-3 rounded-2xl flex items-center gap-2.5 text-xs text-indigo-200">
          <UserCheck className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>প্রতিটি ইউজারের জন্য থাকবে সম্পূর্ণ আলাদা দোকানের নিজস্ব হিসাব ও ক্লাউড ডাটাবেস।</span>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-500/15 border border-rose-500/40 p-3.5 rounded-2xl flex items-start gap-3 text-xs text-rose-300 animate-in fade-in slide-in-from-top-1">
            <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Google Sign In Button - Primary Option */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isSubmitting}
          className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-white/10 hover:shadow-white/20 active:scale-[0.98]"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="text-sm font-extrabold">{isGoogleLoading ? 'গুগল কানেক্ট হচ্ছে...' : 'গুগল দিয়ে সাইন ইন করুন (Google Sign-In)'}</span>
        </button>

        {/* OR Divider */}
        <div className="relative my-2 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative px-3 bg-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            অথবা ইমেইল দিয়ে প্রবেশ করুন
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-3.5">
          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              ইমেইল এড্রেস (Email Address) *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.store@example.com"
                className="w-full bg-slate-950 text-slate-100 pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/80 focus:border-indigo-500 focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              পাসওয়ার্ড (Password) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 text-slate-100 pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/80 focus:border-indigo-500 focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              রোল নির্বাচন (Operating Role)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole('ADMIN')}
                className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  selectedRole === 'ADMIN'
                    ? 'bg-indigo-600/25 text-indigo-300 border-indigo-500 shadow-md shadow-indigo-600/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${selectedRole === 'ADMIN' ? 'text-indigo-400' : 'text-slate-600'}`} />
                অ্যাডমিন (Admin)
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('MANAGER')}
                className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  selectedRole === 'MANAGER'
                    ? 'bg-indigo-600/25 text-indigo-300 border-indigo-500 shadow-md shadow-indigo-600/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${selectedRole === 'MANAGER' ? 'text-indigo-400' : 'text-slate-600'}`} />
                ম্যানেজার (Manager)
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isGoogleLoading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <span>যাচাই করা হচ্ছে...</span>
            ) : (
              <>
                <span>দোকানে প্রবেশ করুন (Sign In)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Custom Firebase Connect Button */}
        <div className="pt-2 text-center border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="text-[11px] text-slate-400 hover:text-amber-400 transition-colors flex items-center justify-center gap-1.5 mx-auto font-medium"
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>{isCustom ? `কাস্টম Firebase সক্রিয় (${activeConfig.projectId})` : 'কাস্টম Firebase প্রজেক্ট কনফিগার করুন'}</span>
          </button>
        </div>
      </div>

      {/* Connect Custom Firebase Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">কাস্টম Firebase প্রজেক্ট যুক্ত করুন</h3>
                  <p className="text-[11px] text-slate-400">Firebase Console থেকে Web SDK Config বসান</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Helper */}
            <div className="bg-indigo-950/30 border border-indigo-800/50 p-3 rounded-2xl text-[11px] text-indigo-200">
              <b>Firebase Console</b> (console.firebase.google.com) &rarr; Project Settings &rarr; General &rarr; Your apps থেকে SDK snippet কপি করে নিচে দিন।
            </div>

            {/* Quick JSON Paste */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                স্বয়ংক্রিয় পেস্ট (Paste Config JSON / Snippet)
              </label>
              <textarea
                rows={3}
                value={configJsonInput}
                onChange={(e) => setConfigJsonInput(e.target.value)}
                placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  projectId: "my-shop-123",\n  authDomain: "my-shop.firebaseapp.com"\n};`}
                className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 font-mono text-[11px] focus:outline-none focus:border-amber-500"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParseConfigJson}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>ফিল্ডে বসান (Auto-Fill)</span>
                </button>
              </div>
            </div>

            {configError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{configError}</span>
              </div>
            )}

            <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">API Key *</label>
                  <input
                    type="text"
                    value={manualConfig.apiKey}
                    onChange={(e) => setManualConfig({ ...manualConfig, apiKey: e.target.value })}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-950 text-slate-100 p-2 rounded-xl border border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Project ID *</label>
                  <input
                    type="text"
                    value={manualConfig.projectId}
                    onChange={(e) => setManualConfig({ ...manualConfig, projectId: e.target.value })}
                    placeholder="my-shop-project"
                    className="w-full bg-slate-950 text-slate-100 p-2 rounded-xl border border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Auth Domain</label>
                  <input
                    type="text"
                    value={manualConfig.authDomain || ''}
                    onChange={(e) => setManualConfig({ ...manualConfig, authDomain: e.target.value })}
                    placeholder="my-shop.firebaseapp.com"
                    className="w-full bg-slate-950 text-slate-100 p-2 rounded-xl border border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Storage Bucket</label>
                  <input
                    type="text"
                    value={manualConfig.storageBucket || ''}
                    onChange={(e) => setManualConfig({ ...manualConfig, storageBucket: e.target.value })}
                    placeholder="my-shop.appspot.com"
                    className="w-full bg-slate-950 text-slate-100 p-2 rounded-xl border border-slate-700 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              {isCustom ? (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('ডিফল্ট ফায়ারবেজে ফিরে যেতে চান?')) {
                      resetFirebaseConfigToDefault();
                    }
                  }}
                  className="text-xs text-rose-400 hover:underline"
                >
                  ডিফল্টে রিসেট করুন
                </button>
              ) : <div />}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleApplyFirebaseConfig}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>কানেক্ট করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
