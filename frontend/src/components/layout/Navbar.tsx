import React from 'react';
import { RefreshCw, Search, Bell, Clock, ShieldCheck, Server, User, Sparkles } from 'lucide-react';
import { HealthStatus } from '../../types';

interface NavbarProps {
  health: HealthStatus | null;
  onResetDemo: () => void;
  resetting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ health, onResetDemo, resetting }) => {
  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Search Input matching Reference UI */}
      <div className="flex items-center space-x-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoices, transactions, customers..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100/70 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Backend & DB Health Indicator */}
        {health && (
          <div className="hidden lg:flex items-center space-x-2 text-xs bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-slate-700">FastAPI Live</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-[11px] text-slate-500">{health.database_mode}</span>
            <span className="text-slate-300">•</span>
            <span className={`text-[11px] font-semibold ${health.gemini_configured ? "text-emerald-600" : "text-amber-600"}`}>
              {health.gemini_configured ? "Gemini Live" : "Rule Engine Fallback"}
            </span>
          </div>
        )}

        {/* Demo Reset Button */}
        <button
          onClick={onResetDemo}
          disabled={resetting}
          className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 transition"
          title="Restore pristine seed data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          <span>{resetting ? 'Resetting...' : 'Reset Demo Data'}</span>
        </button>

        {/* Action icons */}
        <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
          <button className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition relative">
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-1.5 right-1.5"></span>
          </button>
          <div className="flex items-center space-x-2 pl-1 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
              AC
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-none">AcmeCorp</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Accounts Admin</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
