import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Send,
  AlertCircle,
  MessagesSquare,
  CheckCircle2,
  History,
  Users,
  Building2,
  Settings as SettingsIcon
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  reviewCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, reviewCount }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'collections', label: 'Collections Agent', icon: Send },
    { id: 'reviews', label: 'Needs Attention', icon: AlertCircle, badge: reviewCount },
    { id: 'conversations', label: 'Conversations', icon: MessagesSquare },
    { id: 'reconciliation', label: 'Reconciliation', icon: CheckCircle2 },
    { id: 'payments', label: 'Payment Ledger', icon: History },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'settings', label: 'System Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Platform Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-xs text-slate-400">
        <div className="font-medium text-slate-300">Policy Rules Active</div>
        <div className="mt-1 space-y-1 text-[11px] text-slate-500">
          <div>• 10% TDS allowed (India)</div>
          <div>• 3-day dispute window</div>
          <div>• Dynamic overdue tracking</div>
        </div>
      </div>
    </aside>
  );
};
