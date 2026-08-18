import React, { useState } from 'react';
import {
  Search,
  Bell,
  Plus,
  ShoppingCart,
  User,
  Shield,
  Sun,
  Moon,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  LogOut
} from 'lucide-react';
import { Role, NotificationItem } from '../types';

interface HeaderProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  activeRole: Role;
  setActiveRole: (role: Role) => void;
  onOpenSearch: () => void;
  notifications: NotificationItem[];
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onQuickAction: (action: 'sale' | 'product' | 'expense') => void;
  userEmail?: string;
  userName?: string;
  userPhoto?: string;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  activeRole,
  setActiveRole,
  onOpenSearch,
  notifications,
  darkMode,
  setDarkMode,
  onQuickAction,
  userEmail,
  userName,
  userPhoto,
  onLogout
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const rolesList: { role: Role; label: string; desc: string }[] = [
    { role: 'ADMIN', label: 'Admin (Full Access)', desc: 'Access to POS, Financials, Reports, and System Settings' },
    { role: 'MANAGER', label: 'Store Manager', desc: 'Access to Products, POS, Purchases, Stock, and Reports' }
  ];

  return (
    <header className="sticky top-0 z-20 h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Title & Breadcrumb */}
      <div className="flex items-center gap-3">
      </div>

      {/* Center Search Bar */}
      <div className="flex-1 max-w-md hidden md:block">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-400 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-colors shadow-inner text-left"
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="flex-1 truncate">Global search products, barcodes, customers, invoices...</span>
          <kbd className="px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-700/80 border border-slate-600 rounded">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right Action Icons & Role Switcher */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Quick Actions Dropdown / Buttons */}
        <div className="hidden lg:flex items-center gap-2 border-r border-slate-800 pr-3">
          <div 
            title="Firebase Firestore, Realtime DB & Cloud Storage Connected (Permanent Lifetime Storage)"
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 cursor-default"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Firebase Cloud & Storage Live</span>
          </div>

          <button
            onClick={() => onQuickAction('sale')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            + New Sale
          </button>
        </div>

        {/* Mobile Search Button */}
        <button
          onClick={onOpenSearch}
          className="md:hidden p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg"
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                <span className="text-xs font-bold text-slate-200">System Notifications</span>
                <span className="text-[10px] text-indigo-400 font-semibold">{notifications.length} alerts</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 flex gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{n.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Role Switcher Menu */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-xs text-slate-200 font-semibold transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">{activeRole} Mode</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50">
              <div className="px-3 py-1.5 border-b border-slate-800 mb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Switch Operating Role
              </div>
              {rolesList.map((r) => (
                <button
                  key={r.role}
                  onClick={() => {
                    setActiveRole(r.role);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-start gap-2.5 transition-colors ${
                    activeRole === r.role ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${activeRole === r.role ? 'text-indigo-400' : 'text-slate-600'}`} />
                  <div>
                    <div className="font-bold">{r.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5">{r.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Logged in user info & Logout button */}
        {userEmail && (
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={userName || userEmail}
                className="w-8 h-8 rounded-full border border-slate-700 object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center border border-indigo-500/50 shrink-0">
                {(userName || userEmail).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-100 truncate max-w-[130px]">
                {userName || userEmail.split('@')[0]}
              </span>
              <span className="text-[10px] text-slate-400 truncate max-w-[130px]">{userEmail}</span>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                title="Logout / Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">লগআউট</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
