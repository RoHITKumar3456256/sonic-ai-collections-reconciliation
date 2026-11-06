import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  MoreHorizontal,
  ChevronDown,
  Percent,
  Clock,
  Send,
  PieChart as PieIcon,
  BarChart3,
  ShieldCheck
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
  const [activeTab, setActiveTab] = useState<'Summary' | 'Profit' | 'Tasks Done' | 'Actions Completed' | 'Balances'>('Summary');

  const totalOutstanding = invoices
    .filter(i => i.status === 'sent')
    .reduce((sum, i) => sum + i.balance_due, 0);

  const totalOverdue = overdueInvoices
    .reduce((sum, i) => sum + i.balance_due, 0);

  const totalCollected = payments
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingRecon = suggestions.filter(s => s.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Top Header matching Image 2 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time accounts receivable cash flow, automated collections intelligence, and bank ledger sync.
          </p>
        </div>

        {/* Filter Dropdowns matching Image 2 */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-xl p-1 text-xs shadow-sm">
            {(['Summary', 'Profit', 'Tasks Done', 'Actions Completed', 'Balances'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
              <span>This Year</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
              <span>All Currencies</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Row 1 matching Image 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span>+1.2%</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Overdue Receivables</div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              ₹{totalOverdue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-2">
            <span>{overdueInvoices.length} overdue invoices</span>
            <button onClick={() => onNavigate('collections')} className="text-blue-600 hover:text-blue-700 font-semibold flex items-center">
              Chase <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span>+2.2%</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Outstanding Book</div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              ₹{totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-2">
            <span>11 Enterprise Clients</span>
            <span className="text-slate-600 font-medium">Net 30 terms</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span>+1.9%</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Reconciled Collections</div>
            <div className="text-2xl font-extrabold text-emerald-600 tracking-tight mt-1">
              ₹{totalCollected.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-2">
            <span>{payments.length} verified receipts</span>
            <button onClick={() => onNavigate('payments')} className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center">
              Ledger <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              <span>{reviews.length} pending</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Needs Attention Queue</div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              {reviews.length} <span className="text-xs font-medium text-slate-400">cases</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-2">
            <span>Disputes & Exceptions</span>
            <button onClick={() => onNavigate('reviews')} className="text-amber-600 hover:text-amber-700 font-semibold flex items-center">
              Review <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Row 2 matching Image 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Weekly Activity</div>
            <div className="text-xl font-bold text-slate-800 mt-0.5">28 actions</div>
          </div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+8.2%</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Statement Matches</div>
            <div className="text-xl font-bold text-slate-800 mt-0.5">{suggestions.length} rows</div>
          </div>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{pendingRecon} open</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">TDS Compliance</div>
            <div className="text-xl font-bold text-slate-800 mt-0.5">10% Subtotal</div>
          </div>
          <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Form 16A</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Total Saved Time</div>
            <div className="text-xl font-bold text-slate-800 mt-0.5">42 hrs</div>
          </div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+12%</span>
        </div>
      </div>

      {/* Charts Grid: matching Image 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profit Over Time / Spline Chart (Image 2) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Collections Curve & Recovery Rate</h2>
              <p className="text-xs text-slate-400">Cash velocity and receivables recovery trajectory over time</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 font-bold">This Year</span>
              <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal className="w-4 h-4" /></button>
            </div>
          </div>

          {/* SVG Smooth Spline Curve matching Image 2 */}
          <div className="relative h-64 w-full pt-4">
            <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Background grid lines */}
              <line x1="0" y1="30" x2="600" y2="30" stroke="#f1f5f9" strokeDasharray="4 4" />
              <line x1="0" y1="80" x2="600" y2="80" stroke="#f1f5f9" strokeDasharray="4 4" />
              <line x1="0" y1="130" x2="600" y2="130" stroke="#f1f5f9" strokeDasharray="4 4" />
              <line x1="0" y1="180" x2="600" y2="180" stroke="#f1f5f9" />

              {/* Area fill */}
              <path
                d="M 20 170 Q 80 160 140 120 T 260 70 T 360 140 T 460 60 T 580 40 L 580 180 L 20 180 Z"
                fill="url(#curveGradient)"
              />
              {/* Line path */}
              <path
                d="M 20 170 Q 80 160 140 120 T 260 70 T 360 140 T 460 60 T 580 40"
                fill="none"
                stroke="#2563eb"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Highlight Pin at (260, 70) matching Image 2 "87%" */}
              <circle cx="260" cy="70" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" />
              <g transform="translate(242, 38)">
                <rect width="36" height="20" rx="6" fill="#2563eb" />
                <text x="18" y="14" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">87%</text>
              </g>

              {/* X Axis labels */}
              <text x="30" y="196" fill="#94a3b8" fontSize="10">Jan</text>
              <text x="130" y="196" fill="#94a3b8" fontSize="10">Mar</text>
              <text x="250" y="196" fill="#94a3b8" fontSize="10">May</text>
              <text x="360" y="196" fill="#94a3b8" fontSize="10">Jul</text>
              <text x="470" y="196" fill="#94a3b8" fontSize="10">Sep</text>
              <text x="560" y="196" fill="#94a3b8" fontSize="10">Nov</text>
            </svg>
          </div>
        </div>

        {/* Right: Category Donut Chart (Image 2) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Distribution by Aging & Status</h2>
            <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal className="w-4 h-4" /></button>
          </div>

          <div className="flex flex-col items-center justify-center py-2">
            {/* SVG Donut */}
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="18" />
                {/* Overdue (Rose) */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f43f5e" strokeWidth="18" strokeDasharray="75 238" strokeDashoffset="0" />
                {/* Sent Active (Blue) */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#3b82f6" strokeWidth="18" strokeDasharray="60 238" strokeDashoffset="-75" />
                {/* Paid (Emerald) */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10b981" strokeWidth="18" strokeDasharray="50 238" strokeDashoffset="-135" />
                {/* Draft (Amber) */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f59e0b" strokeWidth="18" strokeDasharray="30 238" strokeDashoffset="-185" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-slate-800">14</span>
                <span className="text-[10px] text-slate-400 font-medium">Invoices</span>
              </div>
            </div>

            {/* Legend matching Image 2 */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mt-4 w-full">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="text-slate-600">Overdue (60%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="text-slate-600">Sent Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600">Paid In Full</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-slate-600">Draft Invoices</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Monthly Revenue Bars matching Image 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Monthly Collections Volume</h2>
              <p className="text-xs text-slate-400">Monthly gross collections receipts across currencies</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">
              12 Months View
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2">
            {[
              { m: 'Jan', h: '40%' },
              { m: 'Feb', h: '65%' },
              { m: 'Mar', h: '50%' },
              { m: 'Apr', h: '80%' },
              { m: 'May', h: '55%' },
              { m: 'Jun', h: '75%' },
              { m: 'Jul', h: '95%', highlight: '₹324,000' },
              { m: 'Aug', h: '70%' },
              { m: 'Sep', h: '85%' },
              { m: 'Oct', h: '60%' },
              { m: 'Nov', h: '75%' },
              { m: 'Dec', h: '50%' }
            ].map((col, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                {col.highlight && (
                  <div className="absolute -top-7 bg-slate-900 text-white text-[10px] font-bold py-0.5 px-2 rounded shadow-md whitespace-nowrap">
                    {col.highlight}
                  </div>
                )}
                <div
                  style={{ height: col.h }}
                  className={`w-full rounded-t-lg transition-all ${
                    col.highlight
                      ? 'bg-blue-600 shadow-md shadow-blue-500/20'
                      : 'bg-blue-400/80 hover:bg-blue-500'
                  }`}
                ></div>
                <span className="text-[10px] font-medium text-slate-400">{col.m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Chasing Action Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Collections Assistant</h3>
              </div>
              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 font-bold rounded-full">Active</span>
            </div>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              Automated reminder sequence is ready to engage {overdueInvoices.length} past-due domestic and international accounts with ground-truth validation.
            </p>
            <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Top Debtor:</span>
                <span className="font-bold text-slate-900">Quillon Tech Innovations</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Amount:</span>
                <span className="font-bold text-rose-600">₹354,000 (TDS eligible)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('collections')}
            className="w-full mt-4 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center space-x-1.5"
          >
            <span>Launch Collections Chaser</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
