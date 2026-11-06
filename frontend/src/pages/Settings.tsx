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
        <h1 className="text-2xl font-bold tracking-tight text-white">System Diagnostics & Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Infrastructure health, environment connectivity, and evaluation demo control.
        </p>
      </div>

      {resetNotice && (
        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/50 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{resetNotice}</span>
          </div>
          <button onClick={() => setResetNotice(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Diagnostics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend & DB Health */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-blue-400 border-b border-slate-800 pb-3">
            <Server className="w-5 h-5" />
            <h2 className="text-sm font-semibold text-white">Application & Storage Engine</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">FastAPI Backend Status:</span>
              <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active & Healthy</span>
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Database Driver:</span>
              <span className="font-mono text-white">
                {health?.database_mode || 'Checking...'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Platform Environment:</span>
              <span className="font-mono text-slate-300 uppercase">{health?.environment || 'development'}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Deterministic Ref Date:</span>
              <span className="font-mono text-blue-400">2026-11-01</span>
            </div>
          </div>
        </div>

        {/* External Integrations */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-3">
            <Cpu className="w-5 h-5" />
            <h2 className="text-sm font-semibold text-white">AI & Communication Channels</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Google Gemini API:</span>
              <span className={health?.gemini_configured ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                {health?.gemini_configured ? "Connected (Live LLM)" : "Rule Engine Fallback (Ready)"}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Outbound SMTP Mailer:</span>
              <span className={health?.smtp_configured ? "text-emerald-400 font-semibold" : "text-blue-400 font-semibold"}>
                {health?.smtp_configured ? "Connected" : "Simulated Safe Mode"}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Inbound IMAP Poller:</span>
              <span className={health?.imap_configured ? "text-emerald-400 font-semibold" : "text-blue-400 font-semibold"}>
                {health?.imap_configured ? "Connected" : "Interactive Simulation Ready"}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Matching Algorithm:</span>
              <span className="font-semibold text-white">RapidFuzz + Multi-Signal Deterministic</span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Reset Card */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2 text-rose-400 border-b border-slate-800 pb-3">
          <RefreshCw className="w-5 h-5" />
          <h2 className="text-sm font-semibold text-white">Evaluation Reset Control</h2>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
          Instantly wipes transient demo data (uploaded statement rows, generated match suggestions, customer reply threads, approved receipts) and re-loads pristine seed records from <code>data/organization.json</code>, <code>data/customers.json</code>, and <code>data/invoices.json</code>.
        </p>

        <div>
          <button
            onClick={handleTriggerReset}
            disabled={resetting}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Restoring Ground Truth...' : 'Reset to Clean Initial State'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
