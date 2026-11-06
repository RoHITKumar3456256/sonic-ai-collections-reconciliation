import React from 'react';
import {
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Send,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { Invoice, ReconciliationSuggestion, ReviewItem, Payment } from '../types';

interface DashboardProps {
  invoices: Invoice[];
  overdueInvoices: Invoice[];
  reviews: ReviewItem[];
  suggestions: ReconciliationSuggestion[];
  payments: Payment[];
  onNavigate: (tab: string) => void;
  onSendReminder: (invId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  invoices,
  overdueInvoices,
  reviews,
  suggestions,
  payments,
  onNavigate,
  onSendReminder
}) => {
  // Aggregate stats (converting INR as base for display or summing)
  const totalOutstanding = invoices
    .filter(i => i.status === 'sent')
    .reduce((sum, i) => sum + i.balance_due, 0);

  const totalOverdue = overdueInvoices
    .reduce((sum, i) => sum + i.balance_due, 0);

  const totalCollected = payments
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingReconCount = suggestions.filter(s => s.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Collections & Cash Flow Overview</h1>
        <p className="text-sm text-slate-400 mt-1">
          Automated receivables tracking, human-in-the-loop dispute governance, and deterministic bank reconciliation.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Overdue</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white tracking-tight">
            ₹{totalOverdue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="mt-2 text-xs text-rose-400 flex items-center space-x-1">
            <span>{overdueInvoices.length} overdue invoices eligible for chasing</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Outstanding</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white tracking-tight">
            ₹{totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Across active enterprise clients
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Receipts Cleared</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-400 tracking-tight">
            ₹{totalCollected.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {payments.length} verified bank allocations
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Needs Attention</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white tracking-tight">
            {reviews.length}
          </div>
          <div className="mt-2 text-xs text-amber-400">
            Disputes, legal threats & exceptions
          </div>
        </div>
      </div>

      {/* Two column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Overdue Invoices Quick Chasing */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Eligible Overdue Receivables</h2>
              <p className="text-xs text-slate-400">Sent invoices with balance {'>'} 0 and past due date</p>
            </div>
            <button
              onClick={() => onNavigate('collections')}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center space-x-1"
            >
              <span>View Collections Agent</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/50 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Invoice</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3">Overdue</th>
                  <th className="py-2.5 px-3">Balance</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {overdueInvoices.slice(0, 5).map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-3 font-semibold text-white">{inv.invoice_number}</td>
                    <td className="py-3 px-3 text-slate-300">{inv.customer_name}</td>
                    <td className="py-3 px-3 text-slate-400">{inv.due_date}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {inv.days_overdue} days
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-white">
                      {inv.currency} {inv.balance_due.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onSendReminder(inv.id)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm transition"
                      >
                        <Send className="w-3 h-3" />
                        <span>Remind</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {overdueInvoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      No overdue invoices at this time.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Bank Recon & Review Summary */}
        <div className="space-y-6">
          {/* Bank Recon Quick Card */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Bank Statement Engine</h3>
              </div>
              <button
                onClick={() => onNavigate('reconciliation')}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-0.5"
              >
                <span>Open Recon</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Deterministic 5-signal matching engine with TDS 10% deduction calculation and debit exclusion.
            </p>
            <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Pending Match Suggestions:</span>
              <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-700">
                {pendingReconCount}
              </span>
            </div>
            <button
              onClick={() => onNavigate('reconciliation')}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              Upload Statement CSV & Review Matches
            </button>
          </div>

          {/* Governance Notice */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-blue-400">
              <ShieldCheck className="w-4 h-4" />
              <h4 className="text-xs font-semibold uppercase tracking-wider">Security & Governance</h4>
            </div>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Customer data strictly isolated in LLM prompts</li>
              <li>Fact validation prevents hallucinated balances</li>
              <li>Disputes and extensions gated by human review</li>
              <li>Idempotent payment approval logic</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
