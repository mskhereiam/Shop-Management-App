import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Download, 
  Upload, 
  CheckCircle, 
  Database, 
  Cloud, 
  ShieldCheck, 
  Image as ImageIcon, 
  Loader2, 
  Flame, 
  RefreshCw, 
  ExternalLink, 
  Key, 
  Check, 
  AlertCircle,
  Server,
  Zap,
  RotateCcw
} from 'lucide-react';
import { ShopSettings } from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import { 
  uploadFileToFirebaseStorage, 
  getActiveFirebaseConfig, 
  isUsingCustomFirebaseConfig, 
  saveCustomFirebaseConfig, 
  resetFirebaseConfigToDefault,
  testFirestoreConnection,
  FirebaseCustomConfig
} from '../firebase';
import {
  testSupabaseConnection,
  getSupabaseCredentials,
  DEFAULT_SUPABASE_URL
} from '../supabase';

interface SettingsViewProps {
  settings: ShopSettings;
  tenantId?: string;
  onSaveSettings: (s: ShopSettings) => void;
  onRestoreBackupJSON: (data: any) => void;
  fullDataBackup: any;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  tenantId,
  onSaveSettings,
  onRestoreBackupJSON,
  fullDataBackup
}) => {
  const [formData, setFormData] = useState<ShopSettings>({ ...settings });
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<any | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoNotice, setLogoNotice] = useState<string | null>(null);

  // Supabase State
  const [supabaseCreds, setSupabaseCreds] = useState(getSupabaseCredentials());
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Firebase Custom Config State
  const [activeConfig, setActiveConfig] = useState<FirebaseCustomConfig>(getActiveFirebaseConfig());
  const [isCustomConfig, setIsCustomConfig] = useState<boolean>(isUsingCustomFirebaseConfig());
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [configJsonInput, setConfigJsonInput] = useState<string>('');
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
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    // Initial ping test
    handleTestConnection();
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testFirestoreConnection();
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, message: e?.message || 'Connection test failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    setSupabaseTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setSupabaseTestResult(res);
    } catch (e: any) {
      setSupabaseTestResult({ success: false, message: e?.message || 'Supabase test failed' });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleRunAutoMigration = async () => {
    setIsMigrating(true);
    setMigrationResult(null);
    try {
      const res = await fetch('/api/supabase/migrate', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMigrationResult({ success: true, message: data.message || 'সকল টেবিল সফলভাবে তৈরি হয়েছে!' });
        handleTestSupabase();
      } else {
        setMigrationResult({ success: false, message: data.error || 'মাইগ্রেশন ব্যর্থ হয়েছে' });
      }
    } catch (e: any) {
      setMigrationResult({ success: false, message: e?.message || 'সার্ভার যোগাযোগ ব্যর্থ হয়েছে' });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleParseConfigJson = () => {
    setConfigError(null);
    try {
      const trimmed = configJsonInput.trim();
      if (!trimmed) {
        setConfigError('অনুগ্রহ করে Firebase SDK config কোড বা JSON পেস্ট করুন।');
        return;
      }

      // Try extract JSON or JS object from string (e.g. const firebaseConfig = { ... };)
      let cleaned = trimmed;
      if (cleaned.includes('{') && cleaned.includes('}')) {
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }

      // Convert JS object keys if unquoted
      const jsonValidString = cleaned
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/'/g, '"')
        .replace(/,\s*}/g, '}');

      let parsed: any;
      try {
        parsed = JSON.parse(jsonValidString);
      } catch {
        // Fallback loose regex extraction
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
          throw new Error('Firebase কনফিগারেশন পার্স করা যায়নি। অনুগ্রহ করে সঠিক apiKey ও projectId দিন।');
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

  const handleResetToDefaultFirebase = () => {
    if (confirm('আপনি কি ডিফল্ট ফায়ারবেজ ডাটাবেসে ফিরে যেতে চান?')) {
      resetFirebaseConfigToDefault();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setLogoNotice(null);
    const res = await uploadFileToFirebaseStorage(
      file, 
      `store/logo_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
      tenantId
    );
    setIsUploadingLogo(false);

    if (res.success && res.url) {
      const updated = { ...formData, logoUrl: res.url };
      setFormData(updated);
      onSaveSettings(updated);
      setLogoNotice('Logo uploaded to Firebase Cloud Storage & saved!');
      setTimeout(() => setLogoNotice(null), 4000);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const updated = { ...formData, logoUrl: reader.result as string };
          setFormData(updated);
          onSaveSettings(updated);
          setLogoNotice('Logo saved locally');
          setTimeout(() => setLogoNotice(null), 3000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadBackup = () => {
    const jsonStr = JSON.stringify(fullDataBackup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OneStudioCodes_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed) {
            setPendingRestoreData(parsed);
          }
        } catch (err) {
          alert('Invalid JSON backup file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Firebase Cloud Services & Account Connection Card */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Flame className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 flex-wrap">
                Firebase Cloud Database & Storage
                {isCustomConfig ? (
                  <span className="px-2 py-0.5 text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-700 rounded-full font-bold">
                    ● Custom Firebase Connected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full font-bold">
                    ● Applet Cloud Database Active
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                সকল পণ্য, ইনভয়েস, কাস্টমার লেজার এবং হিসাব রিয়েল-টাইমে ক্লাউডে সিঙ্ক ও সুরক্ষিত থাকে।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
              title="Test connection latency"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
              <span>{isTesting ? 'টেস্ট হচ্ছে...' : 'কানেকশন টেস্ট'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>নতুন ফায়ারবেজ যুক্ত করুন</span>
            </button>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-200 truncate">Cloud Firestore</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                Project: {activeConfig.projectId || 'one-studio-apps'}
              </div>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-200 truncate">Authentication & AuthDomain</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                {activeConfig.authDomain || `${activeConfig.projectId}.firebaseapp.com`}
              </div>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-200 truncate">Cloud Storage Bucket</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                {activeConfig.storageBucket || `${activeConfig.projectId}.firebasestorage.app`}
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Ping Result */}
        {testResult && (
          <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
            testResult.success 
              ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300' 
              : 'bg-rose-950/30 border-rose-800 text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              {testResult.success ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
              <span>{testResult.message}</span>
            </div>
            {testResult.latencyMs && (
              <span className="font-mono text-[11px] px-2 py-0.5 bg-slate-900 rounded border border-slate-800">
                {testResult.latencyMs} ms
              </span>
            )}
          </div>
        )}

        {isCustomConfig && (
          <div className="pt-1 flex items-center justify-between text-xs text-slate-400">
            <span>আপনি নিজস্ব কাস্টম Firebase প্রজেক্ট ব্যবহার করছেন।</span>
            <button
              type="button"
              onClick={handleResetToDefaultFirebase}
              className="text-amber-400 hover:text-amber-300 font-medium underline flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> ডিফল্ট ডাটাবেসে ফিরে যান
            </button>
          </div>
        )}
      </div>

      {/* Supabase PostgreSQL Database & Vercel Deployment Card */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-black text-sm">
              ⚡
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 flex-wrap">
                Supabase PostgreSQL Cloud Database
                <span className="px-2 py-0.5 text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full font-bold">
                  ● Supabase Connected
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                PostgreSQL রিলেশনাল ডাটাবেজ ইন্টিগ্রেশন ও Vercel লাইভ হোস্টিং সিঙ্ক।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleTestSupabase}
              disabled={isTestingSupabase}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
              title="Test Supabase database connectivity"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
              <span>{isTestingSupabase ? 'টেস্ট হচ্ছে...' : 'Supabase টেস্ট'}</span>
            </button>

            <button
              type="button"
              onClick={handleRunAutoMigration}
              disabled={isMigrating}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all disabled:opacity-50"
              title="Auto create all tables in PostgreSQL Supabase Database"
            >
              <Zap className={`w-3.5 h-3.5 ${isMigrating ? 'animate-bounce' : ''}`} />
              <span>{isMigrating ? 'টেবিল তৈরি হচ্ছে...' : 'এক ক্লিকে টেবিল তৈরি করুন (Auto Init)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSqlSchema(!showSqlSchema)}
              className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{showSqlSchema ? 'SQL লুকান' : 'SQL স্ক্রিপ্ট'}</span>
            </button>
          </div>
        </div>

        {/* Migration Alert Notification */}
        {migrationResult && (
          <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in ${
            migrationResult.success
              ? 'bg-emerald-950/40 border-emerald-700 text-emerald-300'
              : 'bg-rose-950/40 border-rose-700 text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              {migrationResult.success ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
              <span>{migrationResult.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setMigrationResult(null)}
              className="text-slate-400 hover:text-slate-200 text-xs ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Supabase Status Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Project URL</div>
            <div className="text-xs font-mono text-emerald-400 truncate mt-0.5">
              {supabaseCreds.url}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Client Anon Key (Secured)</div>
            <div className="text-xs font-mono text-slate-300 truncate mt-0.5">
              {supabaseCreds.key.substring(0, 20)}...{supabaseCreds.key.substring(supabaseCreds.key.length - 10)}
            </div>
          </div>
        </div>

        {/* Supabase Ping Test Result */}
        {supabaseTestResult && (
          <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
            supabaseTestResult.success 
              ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300' 
              : 'bg-rose-950/30 border-rose-800 text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              {supabaseTestResult.success ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
              <span>{supabaseTestResult.message}</span>
            </div>
            {supabaseTestResult.latencyMs && (
              <span className="font-mono text-[11px] px-2 py-0.5 bg-slate-900 rounded border border-slate-800">
                {supabaseTestResult.latencyMs} ms
              </span>
            )}
          </div>
        )}

        {/* SQL Schema helper box */}
        {showSqlSchema && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 animate-in fade-in text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">Supabase SQL Editor এ চালানোর স্ক্রিপ্ট:</span>
              <button
                type="button"
                onClick={() => {
                  const sql = `-- Supabase Schema for Store & Inventory Management\ncreate table if not exists products (\n  id text primary key,\n  name text not null,\n  barcode text,\n  sku text,\n  category_id text,\n  brand_id text,\n  unit_id text,\n  purchase_price numeric default 0,\n  sale_price numeric default 0,\n  current_stock numeric default 0,\n  min_stock numeric default 0,\n  image_url text,\n  tenant_id text default 'default',\n  created_at timestamp default now(),\n  updated_at timestamp default now()\n);\n\ncreate table if not exists sales (\n  id text primary key,\n  invoice_number text not null,\n  date text not null,\n  customer_id text,\n  customer_name text,\n  customer_phone text,\n  items jsonb not null default '[]'::jsonb,\n  subtotal numeric default 0,\n  discount numeric default 0,\n  tax numeric default 0,\n  grand_total numeric not null default 0,\n  paid_amount numeric default 0,\n  due_amount numeric default 0,\n  payment_method text,\n  tenant_id text default 'default',\n  created_at timestamp default now(),\n  updated_at timestamp default now()\n);\n\ncreate table if not exists customers (\n  id text primary key,\n  name text not null,\n  phone text,\n  email text,\n  address text,\n  total_spent numeric default 0,\n  due_amount numeric default 0,\n  tenant_id text default 'default',\n  created_at timestamp default now(),\n  updated_at timestamp default now()\n);\n\ncreate table if not exists suppliers (\n  id text primary key,\n  name text not null,\n  company_name text,\n  phone text,\n  email text,\n  address text,\n  due_amount numeric default 0,\n  tenant_id text default 'default',\n  created_at timestamp default now(),\n  updated_at timestamp default now()\n);\n\ncreate table if not exists purchases (\n  id text primary key,\n  po_number text not null,\n  date text not null,\n  supplier_id text,\n  supplier_name text,\n  items jsonb not null default '[]'::jsonb,\n  total_amount numeric not null default 0,\n  paid_amount numeric default 0,\n  due_amount numeric default 0,\n  tenant_id text default 'default',\n  created_at timestamp default now(),\n  updated_at timestamp default now()\n);\n\ncreate table if not exists expenses (\n  id text primary key,\n  title text not null,\n  category_id text,\n  amount numeric not null default 0,\n  date text not null,\n  voucher_no text,\n  payment_method text,\n  tenant_id text default 'default',\n  created_at timestamp default now(),\n  updated_at timestamp default now()\n);\n\ncreate table if not exists incomes (\n  id text primary key,\n  title text not null,\n  category_id text,\n  amount numeric not null default 0,\n  date text not null,\n  voucher_no text,\n  payment_method text,\n  tenant_id text default 'default',\n  created_at timestamp default now(),\n  updated_at timestamp default now()\n);`;
                  navigator.clipboard.writeText(sql);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 3000);
                }}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-1.5"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'কপি হয়েছে!' : 'SQL কোড কপি করুন'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 rounded-lg text-[10px] font-mono text-slate-300 overflow-x-auto max-h-48 border border-slate-800">
{`-- Supabase SQL Editor এ পেস্ট করে Run দিন:
create table if not exists products ( id text primary key, name text not null, barcode text, purchase_price numeric, sale_price numeric, current_stock numeric, min_stock numeric, created_at timestamp default now() );
create table if not exists sales ( id text primary key, invoice_number text not null, items jsonb not null, grand_total numeric, paid_amount numeric, due_amount numeric, date text );
create table if not exists customers ( id text primary key, name text not null, phone text, due_amount numeric, total_spent numeric );
create table if not exists suppliers ( id text primary key, name text not null, company_name text, due_amount numeric );
create table if not exists purchases ( id text primary key, po_number text not null, total_amount numeric, items jsonb );
create table if not exists expenses ( id text primary key, title text not null, amount numeric, date text );
create table if not exists incomes ( id text primary key, title text not null, amount numeric, date text );`}
            </pre>
          </div>
        )}

        {/* Vercel Environment Variables guide */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-300 space-y-2">
          <div className="font-bold text-slate-200 flex items-center gap-1.5">
            <Cloud className="w-4 h-4 text-sky-400" />
            Vercel এ ডিপ্লয় করার সময় Environment Variables সেটআপ:
          </div>
          <p className="text-[11px] text-slate-400">
            Vercel Dashboard &gt; Project Settings &gt; Environment Variables এ নিচের ভ্যারিয়েবল দুটি সেভ করে Redeploy করুন:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <span className="text-indigo-300 block font-bold">VITE_SUPABASE_URL</span>
              <span className="text-slate-400 text-[10px] truncate block">{DEFAULT_SUPABASE_URL}</span>
            </div>
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <span className="text-indigo-300 block font-bold">VITE_SUPABASE_ANON_KEY</span>
              <span className="text-slate-400 text-[10px] truncate block">eyJhbGciOiJIUzI1...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Connect New Firebase Project Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">নতুন ফায়ারবেজ (Firebase) প্রজেক্ট কানেক্ট করুন</h3>
                  <p className="text-xs text-slate-400">আপনার নিজস্ব Firebase Console এর SDK কনফিগারেশন যুক্ত করুন</p>
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

            {/* Step-by-step Helper Guide */}
            <div className="bg-indigo-950/30 border border-indigo-800/50 p-3.5 rounded-2xl space-y-1.5 text-xs text-indigo-200">
              <div className="font-bold flex items-center gap-1.5 text-indigo-300">
                <Zap className="w-4 h-4 text-indigo-400" /> Firebase কনফিগারেশন পাওয়ার নিয়মাবলী:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300 pl-1">
                <li><a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="w-3 h-3" /></a> এ যান এবং আপনার প্রজেক্ট সিলেক্ট করুন।</li>
                <li>Project Overview এর পাশের ⚙️ <b>Project Settings</b> এ ক্লিক করুন।</li>
                <li>নিচে <b>Your apps</b> সেকশনে Web App (&lt;/&gt;) নির্বাচন করুন বা তৈরি করুন।</li>
                <li><b>SDK setup and configuration</b> থেকে <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">const firebaseConfig = &#123; ... &#125;;</code> কপি করে নিচের বক্সে পেস্ট করুন।</li>
              </ol>
            </div>

            {/* Quick JSON Paste */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                স্বয়ংক্রিয় পেস্ট (Paste Firebase Config JSON / JS Snippet)
              </label>
              <div className="flex gap-2">
                <textarea
                  rows={3}
                  value={configJsonInput}
                  onChange={(e) => setConfigJsonInput(e.target.value)}
                  placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "my-shop.firebaseapp.com",\n  projectId: "my-shop-12345",\n  storageBucket: "my-shop.appspot.com",\n  appId: "1:123..."\n};`}
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 font-mono text-[11px] focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParseConfigJson}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>কনফিগ ফিল্ডে বসান (Auto-Fill Fields)</span>
                </button>
              </div>
            </div>

            {configError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{configError}</span>
              </div>
            )}

            {/* Manual Form Fields */}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">App ID</label>
                  <input
                    type="text"
                    value={manualConfig.appId || ''}
                    onChange={(e) => setManualConfig({ ...manualConfig, appId: e.target.value })}
                    placeholder="1:123456789:web:abcdef"
                    className="w-full bg-slate-950 text-slate-100 p-2 rounded-xl border border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Messaging Sender ID</label>
                  <input
                    type="text"
                    value={manualConfig.messagingSenderId || ''}
                    onChange={(e) => setManualConfig({ ...manualConfig, messagingSenderId: e.target.value })}
                    placeholder="1234567890"
                    className="w-full bg-slate-950 text-slate-100 p-2 rounded-xl border border-slate-700 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
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
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>সেভ ও নতুন একাউন্টে কানেক্ট করুন (Save & Connect)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Store Configuration */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100">Shop System Configuration</h2>
          </div>
          {isSavedNotice && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-in fade-in">
              <CheckCircle className="w-4 h-4" /> Settings Saved!
            </span>
          )}
        </div>

        {/* Store Logo Section with Firebase Storage */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
          <label className="block text-xs font-bold text-slate-300">Store / Company Brand Logo</label>
          <div className="flex flex-wrap items-center gap-4">
            {formData.logoUrl ? (
              <div className="relative group">
                <img
                  src={formData.logoUrl}
                  alt="Shop Logo"
                  className="w-16 h-16 rounded-xl object-contain bg-slate-900 border border-slate-700 p-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    const upd = { ...formData, logoUrl: '' };
                    setFormData(upd);
                    onSaveSettings(upd);
                  }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-slate-900 border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500">
                <ImageIcon className="w-6 h-6" />
                <span className="text-[9px]">No Logo</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-2 w-fit">
                {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {isUploadingLogo ? 'Uploading to Firebase Storage...' : 'Upload Logo to Firebase Storage'}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
              <p className="text-[10px] text-slate-400">
                Direct permanent upload to Firebase Cloud Storage bucket.
              </p>
              {logoNotice && <p className="text-[11px] text-emerald-400 font-bold">{logoNotice}</p>}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-bold mb-1">Company / Store Name</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Store Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Tax / VAT Registration #</label>
              <input
                type="text"
                value={formData.taxNumber || ''}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Default VAT Rate (%)</label>
              <input
                type="number"
                value={formData.defaultTaxRate}
                onChange={(e) => setFormData({ ...formData, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Printable Invoice Footer Message</label>
            <input
              type="text"
              value={formData.invoiceFooterMessage || ''}
              onChange={(e) => setFormData({ ...formData, invoiceFooterMessage: e.target.value })}
              className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Store Configuration
            </button>
          </div>
        </form>
      </div>

      {/* Database Backup & Restore */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Database className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-100">Database Export & Backup</h3>
        </div>

        <p className="text-xs text-slate-400">
          Download full JSON store backup containing all products, invoices, customer ledgers, and transactions.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownloadBackup}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export Backup JSON
          </button>

          <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl shadow flex items-center gap-2 cursor-pointer border border-slate-700">
            <Upload className="w-4 h-4" /> Restore JSON File
            <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
          </label>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!pendingRestoreData}
        title="ডাটাবেস রিস্টোর নিশ্চিতকরণ"
        description="আপনি কি নিশ্চিত যে ব্যাকআপ JSON ফাইল থেকে সকল ডাটা রিস্টোর করতে চান? এটি বর্তমান রেকর্ড রিপ্লেস করবে এবং ক্লাউডে সিঙ্ক করবে।"
        confirmText="হ্যাঁ, রিস্টোর করুন"
        cancelText="না, বাতিল"
        onConfirm={() => {
          if (pendingRestoreData) {
            onRestoreBackupJSON(pendingRestoreData);
            setPendingRestoreData(null);
          }
        }}
        onCancel={() => setPendingRestoreData(null)}
      />
    </div>
  );
};
