import React, { useState } from 'react';
import { Settings, Save, Download, Upload, CheckCircle, Database, Cloud, ShieldCheck, Image as ImageIcon, Loader2 } from 'lucide-react';
import { ShopSettings } from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import { uploadFileToFirebaseStorage } from '../firebase';

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
      {/* Firebase Cloud Services & Storage Live Status Card */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Firebase Realtime Database & Cloud Storage
                <span className="px-2 py-0.5 text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full font-bold">
                  ● Lifetime Cloud Sync
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                সকল ডেটা (পণ্য, বিক্রয়, স্টক, ক্রেতা, সাপ্লায়ার) আজীবনের জন্য ক্লাউডে স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকে।
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-200 truncate">Cloud Firestore</div>
              <div className="text-[10px] text-slate-400">Project: one-studio-apps</div>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-200 truncate">Realtime Database</div>
              <div className="text-[10px] text-slate-400">Live Bidirectional Sync</div>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-200 truncate">Cloud Storage Bucket</div>
              <div className="text-[10px] text-slate-400">one-studio-apps.firebasestorage.app</div>
            </div>
          </div>
        </div>
      </div>

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
