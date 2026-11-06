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
  Settings as SettingsIcon,
  Zap,
  LogOut,
  ChevronRight
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
    { id: 'reconciliation', label: 'Bank Reconciliation', icon: CheckCircle2 },
    { id: 'payments', label: 'Payment Ledger', icon: History },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'settings', label: 'Administration', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 bg-[#0a101f] text-slate-300 flex flex-col justify-between p-4 shrink-0 border-r border-slate-900 shadow-xl select-none">
      <div className="space-y-4">
        {/* Logo matching Image 2 "FIN TRACKR" style */}
        <div className="flex items-center space-x-3 px-2 py-1">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
            <Zap className="w-4 h-4 fill-white text-white" />
          </div>
          <div>
            <div className="font-extrabold text-white text-base tracking-wider uppercase font-mono">
              SONIC<span className="text-blue-500">.AI</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wide">
              FINANCE SUITE
            </div>
          </div>
        </div>

        {/* User Card matching Image 2 */}
        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-blue-500/30">
            AC
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">AcmeCorp Finance</div>
            <div className="text-[10px] text-slate-400 truncate">accounts@acmecorp</div>
          </div>
        </div>

        {/* Navigation items matching Image 2 & 3 */}
        <div className="space-y-1 pt-2">
          <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                    isActive ? 'bg-white text-blue-600' : 'bg-rose-500 text-white animate-pulse'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Policy Pill & Footer */}
      <div className="space-y-2 pt-4 border-t border-slate-800/80">
        <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
          <div className="font-semibold text-slate-200 flex items-center justify-between">
            <span>Governance Rules</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <div className="text-[10px] text-slate-400 leading-tight">
            10% TDS (India) • 3-Day Dispute SLA • Idempotent Approvals
          </div>
        </div>
      </div>
    </aside>
  );
};
