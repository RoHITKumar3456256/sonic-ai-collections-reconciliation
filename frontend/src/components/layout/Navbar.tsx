import React from 'react';
import { ShieldCheck, RefreshCw, Zap, Server } from 'lucide-react';
import { HealthStatus } from '../../types';

interface NavbarProps {
  health: HealthStatus | null;
  onResetDemo: () => void;
  resetting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ health, onResetDemo, resetting }) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg tracking-tight text-white">Sonic<span className="text-blue-500">.AI</span></span>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Collections & Recon
            </span>
          </div>
          <p className="text-xs text-slate-400">AcmeCorp India Pvt Ltd • Accounts Receivables</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {health && (
          <div className="hidden md:flex items-center space-x-3 text-xs bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/50">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300">FastAPI API</span>
            </div>
            <span className="text-slate-600">•</span>
            <div className="flex items-center space-x-1.5 text-slate-300">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span>{health.database_mode}</span>
            </div>
            <span className="text-slate-600">•</span>
            <div className="flex items-center space-x-1 text-slate-300">
              <span className={health.gemini_configured ? "text-emerald-400" : "text-amber-400"}>
                {health.gemini_configured ? "Gemini Live" : "Rule-Engine Fallback"}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={onResetDemo}
          disabled={resetting}
          className="flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
          title="Restore pristine seed data and clear test actions"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-blue-400' : ''}`} />
          <span>{resetting ? 'Resetting...' : 'Reset Demo Data'}</span>
        </button>
      </div>
    </header>
  );
};
