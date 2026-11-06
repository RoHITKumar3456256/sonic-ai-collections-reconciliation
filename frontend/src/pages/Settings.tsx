import React, { useState } from 'react';
import { Settings as SettingsIcon, Server, Cpu, Mail, RefreshCw, CheckCircle2, ShieldCheck, Database, Key } from 'lucide-react';
import { HealthStatus } from '../types';
import { api } from '../services/api';

interface SettingsProps {
  health: HealthStatus | null;
  onResetDemo: () => void;
  resetting: boolean;
}

export const Settings: React.FC<SettingsProps> = ({ health, onResetDemo, resetting }) => {
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  const handleTriggerReset = async () => {
    if (!confirm("Are you sure you want to restore the pristine seed data? This will clear test conversations, payments, and uploaded transactions.")) {
      return;
    }
    await onResetDemo();
    setResetNotice("Demo database successfully restored to pristine assignment state.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Diagnostics & Administration</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Backend services, database resilience state, AI connectivity, and evaluation demo control.
        </p>
      </div>

      {resetNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{resetNotice}</span>
          </div>
          <button onClick={() => setResetNotice(null)} className="text-emerald-600 hover:text-emerald-800">✕</button>
        </div>
      )}

      {/* Diagnostics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend & DB Health */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-blue-600 border-b border-slate-100 pb-3">
            <Server className="w-5 h-5" />
            <h2 className="text-sm font-bold text-slate-900">Application & Storage Engine</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">FastAPI Backend Status:</span>
              <span className="flex items-center space-x-1.5 text-emerald-600 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active & Healthy</span>
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Database Driver:</span>
              <span className="font-mono font-bold text-slate-800">
                {health?.database_mode || 'Checking...'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Platform Environment:</span>
              <span className="font-mono font-bold text-slate-700 uppercase">{health?.environment || 'development'}</span>
            </div>

            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500">Deterministic Reference Date:</span>
              <span className="font-mono font-bold text-blue-600">2026-11-01</span>
            </div>
          </div>
        </div>

        {/* AI & Communication */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-indigo-600 border-b border-slate-100 pb-3">
            <Cpu className="w-5 h-5" />
            <h2 className="text-sm font-bold text-slate-900">AI Intelligence & Email Transports</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Google Gemini API:</span>
              <span className={health?.gemini_configured ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                {health?.gemini_configured ? "Connected (Live LLM)" : "Rule Engine Fallback (Ready)"}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Outbound SMTP Mailer:</span>
              <span className={health?.smtp_configured ? "text-emerald-600 font-bold" : "text-blue-600 font-bold"}>
                {health?.smtp_configured ? "Connected (Live SMTP)" : "Simulated Safe Mode"}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Inbound IMAP Poller:</span>
              <span className={health?.imap_configured ? "text-emerald-600 font-bold" : "text-blue-600 font-bold"}>
                {health?.imap_configured ? "Connected (Live IMAP)" : "Interactive Simulation Ready"}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500">Matching Algorithm:</span>
              <span className="font-bold text-slate-800">RapidFuzz + Multi-Signal Calibrated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Reset Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-rose-600 border-b border-slate-100 pb-3">
          <RefreshCw className="w-5 h-5" />
          <h2 className="text-sm font-bold text-slate-900">Evaluation Reset Control</h2>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
          Instantly wipes transient demo data (uploaded statement rows, generated match suggestions, customer reply threads, approved receipts) and re-loads pristine seed records from <code>data/organization.json</code>, <code>data/customers.json</code>, and <code>data/invoices.json</code>.
        </p>

        <div>
          <button
            onClick={handleTriggerReset}
            disabled={resetting}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Restoring Ground Truth...' : 'Reset to Clean Initial State'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
