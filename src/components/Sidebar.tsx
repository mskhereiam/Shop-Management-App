import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ShoppingBag,
  Users,
  Boxes,
  Receipt,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Settings,
  ShieldCheck,
  Building2,
  ChevronRight
} from 'lucide-react';
import { Role } from '../types';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  activeRole: Role;
  companyName: string;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  activeRole,
  companyName,
  collapsed,
  setCollapsed
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER'] },
    { id: 'pos', label: 'POS & Sales', icon: ShoppingCart, roles: ['ADMIN', 'MANAGER'], badge: 'POS' },
    { id: 'sales-directory', label: 'Sales Directory', icon: Receipt, roles: ['ADMIN', 'MANAGER'] },
    { id: 'products', label: 'Product Catalog', icon: Package, roles: ['ADMIN', 'MANAGER'] },
    { id: 'customers', label: 'Customers', icon: Users, roles: ['ADMIN', 'MANAGER'] },
    { id: 'inventory', label: 'Inventory & Stock', icon: Boxes, roles: ['ADMIN', 'MANAGER'] },
    { id: 'expenses', label: 'Other Income & Expense', icon: Receipt, roles: ['ADMIN', 'MANAGER'] },
    { id: 'reports', label: 'Reports & Export', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['ADMIN'] }
  ];

  const roleColors: Record<Role, string> = {
    ADMIN: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    MANAGER: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
  };

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-30 flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white font-bold text-lg shadow-lg shadow-indigo-500/20 shrink-0">
            O
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-slate-100 text-base tracking-tight truncate">One Studio Codes</span>
              <span className="text-xs text-slate-400 truncate flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-400" />
                {companyName || 'One Studio Codes'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Role Indicator */}
      {!collapsed && (
        <div className="px-4 py-2.5 bg-slate-950/20 border-b border-slate-800/50 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Current Role:
          </span>
          <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${roleColors[activeRole]}`}>
            {activeRole}
          </span>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        {menuItems.map((item) => {
          const isAllowed = item.roles.includes(activeRole);
          const isActive = currentView === item.id;
          const Icon = item.icon;

          if (!isAllowed) return null;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group relative ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
              }`} />

              {!collapsed && (
                <span className="flex-1 text-left truncate tracking-wide">{item.label}</span>
              )}

              {!collapsed && item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {item.badge}
                </span>
              )}

              {!collapsed && isActive && (
                <ChevronRight className="w-4 h-4 text-white/80" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer / Collapse Toggle */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/30 flex items-center justify-between">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <span>{collapsed ? '→' : '← Collapse Sidebar'}</span>
        </button>
      </div>
    </aside>
  );
};
